/**
 * The one rule for "is this a usable entity id": a positive safe integer.
 *
 * Accepts a number, or a string of ASCII digits only — so `"1.5"`, `"1e3"`,
 * `" 7"`, `"-2"` and `"0x10"` are all rejected even though `Number()` would turn
 * several of them into a positive number. Route params and query params arrive
 * as strings, while hook arguments arrive as numbers; both go through here so a
 * value the URL layer rejects can never be fetched by a query layer that
 * accepted it.
 *
 * Returns `null` for anything else, including `0`.
 */
export function parsePositiveIntId(raw: unknown): number | null {
  let n: number
  if (typeof raw === 'number') {
    n = raw
  } else if (typeof raw === 'string' && /^\d+$/.test(raw)) {
    n = Number(raw)
  } else {
    return null
  }
  return Number.isSafeInteger(n) && n > 0 ? n : null
}
