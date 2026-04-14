import type { Page, Route } from '@playwright/test'
import { E2E_AUTH_TOKEN, E2E_AUTH_USER } from './auth-storage'
import { mapCamelToSnake } from '../../../src/api/helpers/fieldMappings'

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/**
 * Stubs /api/v1/* so the app runs against `vite preview` without a backend.
 * Maintains in-memory state so PATCHes are reflected in subsequent GETs.
 */
export async function installApiMocks(page: Page): Promise<void> {
  const transactions: Record<number, Record<string, unknown>> = {
    100: {
      id: 100,
      transaction_number: '100001',
      date: '2025-01-15',
      description: 'POS PURCHASE',
      memo: 'WHOLEFDS',
      amount_debit: '-37.31',
      amount_credit: '0',
      balance: '1000.00',
      budget_category: null,
      memo_id: 1,
    },
    101: {
      id: 101,
      transaction_number: '100002',
      date: '2025-01-14',
      description: 'DIRECT DEPOSIT',
      memo: 'PAYROLL',
      amount_debit: '0',
      amount_credit: '2000.00',
      balance: '3000.00',
      budget_category: null,
    },
  }

  const memos: Record<number, Record<string, unknown>> = {
    200: {
      id: 200,
      name: 'WHOLEFDS',
      recurring: true,
      necessary: true,
      ambiguous: false,
      budget_category: null,
      total_amount_debit: 150.0,
      transactions_count: 5,
    },
    201: {
      id: 201,
      name: 'NETFLIX',
      recurring: true,
      necessary: false,
      ambiguous: false,
      budget_category: 'Entertainment - Subscriptions',
      total_amount_debit: 15.99,
      transactions_count: 1,
    },
    7: {
      id: 7,
      name: 'Week summary memo',
      recurring: false,
      necessary: true,
      ambiguous: false,
      budget_category: 'Transport',
      total_amount_debit: 99,
      transactions_count: 2,
    },
    42: {
      id: 42,
      name: 'Month summary memo',
      recurring: false,
      necessary: true,
      ambiguous: false,
      budget_category: 'Food - Groceries',
      total_amount_debit: 12.5,
      transactions_count: 1,
    },
  }

  await page.route(/\/api\/v1\//, async (route: Route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const path = url.pathname
    const sp = url.searchParams

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
      return
    }

    if (path.endsWith('/login') && method === 'POST') {
      await json(route, {
        message: 'ok',
        user: JSON.parse(E2E_AUTH_USER),
        token: E2E_AUTH_TOKEN,
      })
      return
    }

    if (path.includes('/budget-categories')) {
      await json(route, [
        {
          data: {
            Food: { Groceries: {}, Restaurants: {} },
            Entertainment: { Subscriptions: {}, Hobbies: {} },
          },
        },
      ])
      return
    }

    if (path.match(/\/transactions\/months\/[^/]+\/summary$/)) {
      await json(route, [
        {
          memo: '42',
          total_amount_debit: 12.5,
          budget_category: 'Food - Groceries',
        },
        {
          memo: 'Plain text memo',
          total_amount_debit: 3,
          budget_category: '',
        },
      ])
      return
    }
    if (path.match(/\/transactions\/weeks\/[^/]+\/summary$/)) {
      await json(route, [
        {
          memo: '7',
          weekly_amount_debit: 99.0,
          budget_category: 'Transport',
        },
      ])
      return
    }
    if (path.match(/\/transactions\/months\/[^/]+\/weeks$/)) {
      await json(route, [])
      return
    }
    if (path.match(/\/transactions\/weeks\/[^/]+\/days$/)) {
      await json(route, [])
      return
    }
    if (path.match(/\/transactions\/days\/[^/]+\/summary$/)) {
      await json(route, [])
      return
    }

    if (path.endsWith('/transactions/days')) {
      await json(route, [{ day: '2025-01-15' }, { day: '2024-12-20' }])
      return
    }
    if (path.endsWith('/transactions/weeks')) {
      await json(route, [{ week_year: '03-2025' }, { week_year: '52-2024' }])
      return
    }
    if (path.endsWith('/transactions/months')) {
      await json(route, [{ month_year: '01-2025' }, { month_year: '12-2024' }])
      return
    }
    if (path.endsWith('/transactions/years')) {
      await json(route, [{ year: '2025' }, { year: '2024' }])
      return
    }

    if (path.includes('/transactions/pending')) {
      if (method === 'GET') {
        await json(route, [])
        return
      }
      if (method === 'PATCH') {
        await json(route, { ok: true })
        return
      }
    }

    if (path.match(/\/transactions\/(\d+)$/)) {
      const id = Number(path.match(/\/transactions\/(\d+)$/)![1])
      if (method === 'GET') {
        await json(
          route,
          transactions[id] ?? {
            id,
            date: '2024-01-01',
            description: 'E2E',
            memo: 'm',
            amount_debit: '0',
            amount_credit: '0',
          },
        )
        return
      }
      if (method === 'PATCH' || method === 'PUT') {
        const body = req.postDataJSON()
        const updates = mapCamelToSnake(body)
        if (transactions[id]) {
          Object.assign(transactions[id], updates)
        }
        await json(route, transactions[id] ?? { ...updates, id })
        return
      }
    }

    if (path.endsWith('/transactions') || path.match(/\/transactions$/)) {
      // Memo-scoped filtering (used by aggregates and list).
      const memoFilteredRows = () => {
        let rows = Object.values(transactions)
        const memoId = sp.get('memoId')
        if (memoId) rows = rows.filter((t) => String(t.memo_id) === memoId)
        return rows
      }

      if (sp.get('count') === 'true') {
        await json(route, [{ count: memoFilteredRows().length }])
        return
      }
      if (sp.has('interval') && sp.get('dailyTotals') === 'true' && !sp.has('date')) {
        await json(route, false)
        return
      }
      if (sp.get('totalAmountDebit') === 'true') {
        const total = memoFilteredRows().reduce((sum, t) => {
          const n = Number(t.amount_debit)
          return sum + (Number.isFinite(n) ? Math.abs(n) : 0)
        }, 0)
        await json(route, [{ total_amount_debit: total }])
        return
      }
      if (
        sp.get('budgetCategoryHierarchySum') === 'true' ||
        sp.get('budgetCategorySummary') === 'true' ||
        sp.get('historical') === 'true' ||
        sp.get('dailyTotals') === 'true'
      ) {
        await json(route, [])
        return
      }
      if (method === 'POST') {
        await json(route, { id: 1 })
        return
      }
      if (method === 'GET') {
        // Timeframe-filtered list requests return [] (mock doesn't do date-range matching).
        const hasTimeframeFilter = sp.has('timeFrame') && sp.has('date')
        await json(route, hasTimeframeFilter ? [] : memoFilteredRows())
        return
      }
    }

    if (path.match(/\/memos\/[^/]+\/summary$/)) {
      await json(route, { sum_amount_debit: 0, transactions_count: 0 })
      return
    }
    if (path.match(/\/memos\/(\d+)$/) && method === 'GET') {
      const id = Number(path.match(/\/memos\/(\d+)$/)![1])
      await json(
        route,
        memos[id] ?? {
          id,
          name: 'E2E Memo',
          recurring: false,
          necessary: false,
          ambiguous: false,
        },
      )
      return
    }
    if (path.includes('/memos')) {
      if (method === 'GET') {
        if (sp.get('count') === 'true') {
          await json(route, [{ count: Object.values(memos).length }])
          return
        }
        const rows = Object.values(memos)
        const offsetParam = Number(sp.get('offset'))
        const limitParam = Number(sp.get('limit'))
        const offset = Number.isInteger(offsetParam) && offsetParam >= 0 ? offsetParam : 0
        const limit = Number.isInteger(limitParam) && limitParam > 0 ? limitParam : null
        await json(route, limit === null ? rows.slice(offset) : rows.slice(offset, offset + limit))
        return
      }
      if (method === 'PATCH') {
        const body = req.postDataJSON()
        const updates = mapCamelToSnake(body)
        const id = Number(updates.id ?? body.id)
        if (memos[id]) {
          Object.assign(memos[id], updates)
        }
        await json(route, { memo: memos[id] ?? { ...updates, id } })
        return
      }
    }

    await json(route, { e2eMock: 'unhandled', path, method }, 404)
  })
}
