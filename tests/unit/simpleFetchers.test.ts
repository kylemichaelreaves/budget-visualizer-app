import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const patch = vi.fn()
vi.mock('@api/httpClient', () => ({ httpClient: { get, patch } }))

const { fetchTransaction } = await import('@api/transactions/fetchTransaction')
const { fetchPendingTransaction } = await import('@api/transactions/fetchPendingTransaction')
const { fetchWeekSummary } = await import('@api/timeUnits/weeks/fetchWeekSummary')
const { fetchWeeks } = await import('@api/timeUnits/weeks/fetchWeeks')
const { fetchMonths } = await import('@api/timeUnits/months/fetchMonths')
const { fetchMonthSummary } = await import('@api/timeUnits/months/fetchMonthSummary')
const { fetchYears } = await import('@api/timeUnits/years/fetchYears')
const { fetchDays } = await import('@api/timeUnits/days/fetchDays')
const { fetchDailyAmountDebitForInterval } =
  await import('@api/timeUnits/days/fetchDailyAmountDebitForInterval')
const { fetchMemo } = await import('@api/memos/fetchMemo')
const { fetchMemos } = await import('@api/memos/fetchMemos')
const { fetchMemoSummary } = await import('@api/memos/fetchMemoSummary')
const { fetchMemoTransactions } = await import('@api/memos/fetchMemoTransactions')
const { updateMemo } = await import('@api/memos/updateMemo')
const { fetchBudgetCategories } = await import('@api/budgetCategories/fetchBudgetCategories')

beforeEach(() => {
  get.mockReset()
  patch.mockReset()
})

// No fetcher wraps its call in log-and-rethrow anymore: the error reaches the
// caller untouched, and the query/mutation caches do the logging.
describe('plain GET fetchers return the body and let errors through', () => {
  it.each([
    ['fetchPendingTransaction', () => fetchPendingTransaction(4), '/transactions/pending/4'],
    ['fetchWeeks', () => fetchWeeks(), '/transactions/weeks'],
    ['fetchMonths', () => fetchMonths(), '/transactions/months'],
    ['fetchMonthSummary', () => fetchMonthSummary('03-2026'), '/transactions/months/03-2026/summary'],
    ['fetchYears', () => fetchYears(), '/transactions/years'],
    ['fetchDays', () => fetchDays(), '/transactions/days'],
    ['fetchMemo', () => fetchMemo(5), '/memos/5'],
    ['fetchMemoSummary', () => fetchMemoSummary(5), '/memos/5/summary'],
    ['fetchMemos', () => fetchMemos({ limit: 10 }), '/memos'],
    ['fetchMemoTransactions', () => fetchMemoTransactions(5, { limit: 10 }), '/transactions'],
    ['fetchBudgetCategories', () => fetchBudgetCategories(true), '/budget-categories'],
    [
      'fetchDailyAmountDebitForInterval',
      () => fetchDailyAmountDebitForInterval('1 month', '2026-03-01'),
      '/transactions',
    ],
  ] as const)('%s', async (_name, call, url) => {
    get.mockResolvedValue({ data: ['body'] })
    await expect(call()).resolves.toEqual(['body'])
    expect(get.mock.lastCall![0]).toBe(url)

    const err = new Error('down')
    get.mockRejectedValue(err)
    await expect(call()).rejects.toBe(err)
  })
})

describe('fetchTransaction', () => {
  it('unwraps an array response or accepts an object', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }] })
    await expect(fetchTransaction(1)).resolves.toEqual({ id: 1 })
    get.mockResolvedValue({ data: { id: 2 } })
    await expect(fetchTransaction(2)).resolves.toEqual({ id: 2 })
  })

  it.each([[[]], [null], ['nope']])('rejects as not found for %j', async (data) => {
    get.mockResolvedValue({ data })
    await expect(fetchTransaction(3)).rejects.toThrow('Transaction not found: 3')
  })
})

describe('fetchWeekSummary', () => {
  it('unwraps the { json } envelope or a bare array', async () => {
    get.mockResolvedValue({ data: { json: [{ memo: 'a' }] } })
    await expect(fetchWeekSummary('10-2026')).resolves.toEqual([{ memo: 'a' }])
    get.mockResolvedValue({ data: [{ memo: 'b' }] })
    await expect(fetchWeekSummary('10-2026')).resolves.toEqual([{ memo: 'b' }])
  })

  it('rejects an unexpected shape', async () => {
    get.mockResolvedValue({ data: { rows: [] } })
    await expect(fetchWeekSummary('10-2026')).rejects.toThrow('Invalid response format')
  })
})

describe('updateMemo', () => {
  it('validates id and name before sending', async () => {
    await expect(updateMemo({ id: 0, name: 'x' })).rejects.toThrow('Memo ID is required')
    await expect(updateMemo({ id: 1, name: '' })).rejects.toThrow('Memo name is required')
    expect(patch).not.toHaveBeenCalled()
  })

  it('accepts the { memo } envelope or a bare memo', async () => {
    patch.mockResolvedValue({ data: { success: true, memo: { id: 1, name: 'A' } } })
    await expect(updateMemo({ id: 1, name: 'A' })).resolves.toEqual({ id: 1, name: 'A' })
    patch.mockResolvedValue({ data: { id: 1, name: 'B' } })
    await expect(updateMemo({ id: 1, name: 'B' })).resolves.toEqual({ id: 1, name: 'B' })
    expect(patch).toHaveBeenLastCalledWith('/memos/1', { id: 1, name: 'B' })
  })

  it('rejects an unrecognised response', async () => {
    patch.mockResolvedValue({ data: { ok: true } })
    await expect(updateMemo({ id: 1, name: 'A' })).rejects.toThrow('Invalid response format')
  })
})
