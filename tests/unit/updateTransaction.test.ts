import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TransactionPatch } from '@types'

const patch = vi.fn()
vi.mock('@api/httpClient', () => ({ httpClient: { patch } }))
vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

const { updateTransaction } = await import('@api/transactions/updateTransaction')

/** The JSON body sent for `input` — the backend reads camelCase only. */
async function bodyFor(input: TransactionPatch): Promise<Record<string, unknown>> {
  await updateTransaction(input)
  expect(patch).toHaveBeenCalledWith(`/transactions/${input.id}`, expect.anything())
  return patch.mock.calls.at(-1)![1]
}

beforeEach(() => {
  patch.mockReset().mockResolvedValue({ data: {} })
})

describe('updateTransaction', () => {
  it('maps snake_case fields to camelCase and keeps the id', async () => {
    const body = await bodyFor({
      id: 9,
      date: '2026-03-01',
      description: 'POS PURCHASE',
      memo: 'WHOLEFDS',
      amount_debit: '-37.31',
      amount_credit: '0',
      balance: '100.00',
      check_number: '1201',
      fees: '0.50',
    })
    expect(body).toEqual({
      id: 9,
      date: '2026-03-01',
      description: 'POS PURCHASE',
      memo: 'WHOLEFDS',
      amountDebit: '-37.31',
      amountCredit: '0',
      balance: '100.00',
      checkNumber: '1201',
      fees: '0.50',
    })
  })

  it('sends only the fields present on the patch', async () => {
    expect(await bodyFor({ id: 9, fees: '1.00' })).toEqual({ id: 9, fees: '1.00' })
  })

  it('omits null and undefined ordinary fields', async () => {
    const body = await bodyFor({ id: 9, description: undefined, balance: null as unknown as string })
    expect(body).toEqual({ id: 9 })
  })

  it('ignores keys outside the allowlist', async () => {
    const body = await bodyFor({ id: 9, transaction_number: 'T-1', created_at: 'x' } as TransactionPatch)
    expect(body).toEqual({ id: 9 })
  })

  describe('memo_id', () => {
    it('sends null to clear a stale memo association', async () => {
      expect(await bodyFor({ id: 9, memo_id: null })).toEqual({ id: 9, memoId: null })
    })

    it('sends a number through', async () => {
      expect(await bodyFor({ id: 9, memo_id: 200 })).toEqual({ id: 9, memoId: 200 })
    })

    it('omits an explicit undefined', async () => {
      expect(await bodyFor({ id: 9, memo_id: undefined })).toEqual({ id: 9 })
    })
  })

  describe('budget_category and is_split', () => {
    it('sends null to clear a single category', async () => {
      expect(await bodyFor({ id: 9, budget_category: null, is_split: false })).toEqual({
        id: 9,
        budgetCategory: null,
        isSplit: false,
      })
    })

    it('sends a split array as-is, not dropped as an object', async () => {
      const splits = [
        { id: 'a', budget_category_id: 'Food', amount_debit: 60 },
        { id: 'b', budget_category_id: 'Gas', amount_debit: 40 },
      ]
      expect(await bodyFor({ id: 9, budget_category: splits, is_split: true })).toEqual({
        id: 9,
        budgetCategory: splits,
        isSplit: true,
      })
    })

    it('coerces is_split to a boolean', async () => {
      const body = await bodyFor({ id: 9, is_split: 1 as unknown as boolean })
      expect(body.isSplit).toBe(true)
    })
  })

  it('rejects a patch without an id before sending anything', async () => {
    await expect(updateTransaction({ id: 0 })).rejects.toThrow('Transaction ID is required')
    expect(patch).not.toHaveBeenCalled()
  })

  it('rethrows request failures', async () => {
    patch.mockRejectedValueOnce(new Error('500'))
    await expect(updateTransaction({ id: 9, fees: '1' })).rejects.toThrow('500')
  })
})
