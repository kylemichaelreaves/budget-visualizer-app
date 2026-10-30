import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()
const patch = vi.fn()

vi.mock('@api/httpClient', () => ({ httpClient: { post, patch } }))
vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

const { createTransaction } = await import('@api/transactions/createTransaction')
const { updatePendingTransaction } = await import('@api/transactions/updatePendingTransaction')

beforeEach(() => {
  post.mockReset().mockResolvedValue({ data: { id: 1 } })
  patch.mockReset().mockResolvedValue({ data: {} })
})

// resourceQuerier's createTransaction reads camelCase only and 400s without
// memo, amountDebit and date — see the e2e mock, which enforces the same guard.
describe('createTransaction', () => {
  it('POSTs camelCase keys for a debit', async () => {
    await createTransaction({
      date: '2026-03-01',
      description: 'POS PURCHASE',
      memo: 'WHOLEFDS',
      amount_debit: '-37.31',
    })

    expect(post).toHaveBeenCalledWith('/transactions', {
      date: '2026-03-01',
      description: 'POS PURCHASE',
      memo: 'WHOLEFDS',
      amountDebit: '-37.31',
    })
  })

  it('sends amountDebit "0" alongside amountCredit for a credit', async () => {
    await createTransaction({
      date: '2026-03-01',
      description: '',
      memo: 'PAYROLL',
      amount_debit: '0',
      amount_credit: '2000.00',
    })

    const body = post.mock.calls[0]![1]
    expect(body).toEqual({ date: '2026-03-01', memo: 'PAYROLL', amountDebit: '0', amountCredit: '2000.00' })
    expect(body).not.toHaveProperty('amount_debit')
    expect(body).not.toHaveProperty('amount_credit')
  })
})

describe('updatePendingTransaction', () => {
  it('PATCHes a top-level budgetCategory string', async () => {
    await updatePendingTransaction(7, 'Food - Groceries')

    expect(patch).toHaveBeenCalledWith('/transactions/pending/7', { budgetCategory: 'Food - Groceries' })
  })
})
