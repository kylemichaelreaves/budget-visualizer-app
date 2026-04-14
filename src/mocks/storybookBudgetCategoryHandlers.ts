import { http, HttpResponse } from 'msw'
import type { Categories } from '@types'

/** Nested `Categories` payload for Storybook / MSW (`extractBudgetCategoriesData` + `convertToTree`). */
const storyCategories: Categories = {
  Food: {
    Groceries: {},
    Dining: {},
  },
  Housing: {
    Rent: {},
    Insurance: {
      Home: {},
    },
  },
}

/**
 * MSW handlers for `fetchBudgetCategories` / `useBudgetCategories` in Storybook.
 */
export const storybookBudgetCategoryHandlers = [
  http.get('/api/v1/budget-categories', () => HttpResponse.json({ data: storyCategories })),
  http.get('/api/gateway/budget-categories', () => HttpResponse.json({ data: storyCategories })),
]
