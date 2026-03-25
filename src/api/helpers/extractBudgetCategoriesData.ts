import type { Categories } from '@types'

/** Normalizes `/budget-categories` payloads: `{ data }`, `[{ data }]`, or raw nested `Categories`. */
export function extractBudgetCategoriesData(raw: unknown): Categories | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === 'object' && 'data' in item) {
        const inner = (item as { data?: unknown }).data
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
          return inner as Categories
        }
      }
    }
    return null
  }
  if (typeof raw === 'object') {
    const obj = raw as { data?: unknown }
    if (obj.data != null && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as Categories
    }
    return raw as Categories
  }
  return null
}
