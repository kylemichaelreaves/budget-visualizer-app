import type { Page, Route } from '@playwright/test'
import { E2E_AUTH_TOKEN, E2E_AUTH_USER } from './auth-storage'

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/**
 * Stubs /api/v1/* so the app runs against `vite preview` without a backend.
 */
export async function installApiMocks(page: Page): Promise<void> {
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
      await json(route, [{
        data: {
          Food: { Groceries: {}, Restaurants: {} },
          Entertainment: { Subscriptions: {}, Hobbies: {} },
        },
      }])
      return
    }

    if (path.match(/\/transactions\/months\/[^/]+\/summary$/)) {
      await json(route, [])
      return
    }
    if (path.match(/\/transactions\/weeks\/[^/]+\/summary$/)) {
      await json(route, [])
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

    if (path.match(/\/transactions\/\d+$/)) {
      if (method === 'GET') {
        await json(route, {
          id: 1,
          date: '2024-01-01',
          description: 'E2E',
          memo: 'm',
          amount_debit: '0',
          amount_credit: '0',
        })
        return
      }
      if (method === 'PATCH' || method === 'PUT') {
        const body = req.postDataJSON()
        await json(route, [{ ...body, updated_at: new Date().toISOString() }])
        return
      }
    }

    if (path.endsWith('/transactions') || path.match(/\/transactions$/)) {
      if (sp.get('count') === 'true') {
        await json(route, [{ count: 2 }])
        return
      }
      if (sp.has('interval') && sp.get('dailyTotals') === 'true' && !sp.has('date')) {
        await json(route, false)
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
        await json(route, [
          {
            id: 100,
            transaction_number: '100001',
            date: '2025-01-15',
            description: 'POS PURCHASE',
            memo: 'WHOLEFDS',
            amount_debit: -37.31,
            amount_credit: null,
            balance: 1000,
            budget_category: null,
            memo_id: 1,
          },
          {
            id: 101,
            transaction_number: '100002',
            date: '2025-01-14',
            description: 'DIRECT DEPOSIT',
            memo: 'PAYROLL',
            amount_debit: null,
            amount_credit: 2000,
            balance: 3000,
            budget_category: null,
          },
        ])
        return
      }
    }

    if (path.match(/\/memos\/[^/]+\/summary$/)) {
      await json(route, { sum_amount_debit: 0, transactions_count: 0 })
      return
    }
    if (path.match(/\/memos\/\d+$/) && method === 'GET') {
      await json(route, {
        id: 1,
        name: 'E2E Memo',
        recurring: false,
        necessary: false,
        ambiguous: false,
      })
      return
    }
    if (path.includes('/memos')) {
      if (method === 'GET') {
        await json(route, [
          {
            id: 200,
            name: 'WHOLEFDS',
            recurring: true,
            necessary: true,
            ambiguous: false,
            budget_category: null,
            total_amount_debit: 150.0,
            transactions_count: 5,
          },
          {
            id: 201,
            name: 'NETFLIX',
            recurring: true,
            necessary: false,
            ambiguous: false,
            budget_category: 'Entertainment - Subscriptions',
            total_amount_debit: 15.99,
            transactions_count: 1,
          },
        ])
        return
      }
      if (method === 'PATCH') {
        const body = req.postDataJSON()
        await json(route, { memo: { ...body, updated_at: new Date().toISOString() } })
        return
      }
    }

    await json(route, { e2eMock: 'unhandled', path, method }, 404)
  })
}
