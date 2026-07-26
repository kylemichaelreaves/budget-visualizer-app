import { describe, expect, it } from 'vitest'
import {
  maxOffsetForLoadedPages,
  rowsForPage,
} from '@components/transactions/table/transactionsTablePageWindow'

const LIMIT = 100

/** `n` rows, distinguishable per page so slicing mistakes are visible. */
function page(label: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${label}${i}`)
}

describe('rowsForPage', () => {
  const pages = [page('a', 100), page('b', 100), page('c', 40)]

  it('returns the page the server sent for that offset', () => {
    expect(rowsForPage(pages, 1)[0]).toBe('a0')
    expect(rowsForPage(pages, 2)[0]).toBe('b0')
    expect(rowsForPage(pages, 3)[0]).toBe('c0')
  })

  it('returns a short final page as-is rather than back-filling from other pages', () => {
    expect(rowsForPage(pages, 3)).toHaveLength(40)
  })

  /**
   * The defect this replaces: flattening then slicing by page index meant any
   * dropped row pulled later pages backwards. Reading the stored page cannot.
   */
  it('is unaffected by a short page earlier in the window', () => {
    const withShortFirst = [page('a', 98), page('b', 100), page('c', 40)]
    expect(rowsForPage(withShortFirst, 2)[0]).toBe('b0')
    expect(rowsForPage(withShortFirst, 2)).toHaveLength(100)
  })

  it('returns empty for a page that has not been fetched', () => {
    expect(rowsForPage(pages, 4)).toEqual([])
    expect(rowsForPage([], 1)).toEqual([])
  })

  it('returns empty for a non-positive or non-finite page', () => {
    expect(rowsForPage(pages, 0)).toEqual([])
    expect(rowsForPage(pages, -1)).toEqual([])
    expect(rowsForPage(pages, Number.NaN)).toEqual([])
  })

  it('returns the stored array by reference so <For> keeps a stable identity', () => {
    expect(rowsForPage(pages, 2)).toBe(pages[1])
    expect(rowsForPage(pages, 2)).toBe(rowsForPage(pages, 2))
  })
})

describe('maxOffsetForLoadedPages', () => {
  it('points at the last page for a full window', () => {
    expect(maxOffsetForLoadedPages([page('a', 100), page('b', 100)], LIMIT)).toBe(100)
  })

  it('counts a short final page as the last page', () => {
    expect(maxOffsetForLoadedPages([page('a', 100), page('b', 40)], LIMIT)).toBe(100)
  })

  /** The query requests offsets until one comes back short, so this is routine. */
  it('skips a trailing empty page instead of parking the user on it', () => {
    expect(maxOffsetForLoadedPages([page('a', 100), page('b', 100), []], LIMIT)).toBe(100)
    expect(maxOffsetForLoadedPages([page('a', 100), [], []], LIMIT)).toBe(0)
  })

  it('returns 0 when nothing has loaded, so the offset falls back to page 1', () => {
    expect(maxOffsetForLoadedPages([], LIMIT)).toBe(0)
    expect(maxOffsetForLoadedPages([[]], LIMIT)).toBe(0)
  })

  it('scales with the page size', () => {
    const pages = [page('a', 25), page('b', 25), page('c', 10)]
    expect(maxOffsetForLoadedPages(pages, 25)).toBe(50)
  })

  it('returns 0 for a nonsensical limit rather than a negative offset', () => {
    expect(maxOffsetForLoadedPages([page('a', 10)], 0)).toBe(0)
    expect(maxOffsetForLoadedPages([page('a', 10)], -5)).toBe(0)
    expect(maxOffsetForLoadedPages([page('a', 10)], Number.NaN)).toBe(0)
  })
})
