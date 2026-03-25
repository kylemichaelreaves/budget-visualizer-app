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
      await json(route, [{ data: {} }])
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
      await json(route, [])
      return
    }
    if (path.endsWith('/transactions/weeks')) {
      await json(route, [])
      return
    }
    if (path.endsWith('/transactions/months')) {
      await json(route, [])
      return
    }
    if (path.endsWith('/transactions/years')) {
      await json(route, [])
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
        await json(route, { ok: true })
        return
      }
    }

    if (path.endsWith('/transactions') || path.match(/\/transactions$/)) {
      if (sp.get('count') === 'true') {
        await json(route, [{ count: 0 }])
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
        await json(route, [])
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
        await json(route, [])
        return
      }
      if (method === 'PATCH') {
        await json(route, { id: 1, name: 'Updated' })
        return
      }
    }

    await json(route, { e2eMock: 'unhandled', path, method }, 404)
  })
}
