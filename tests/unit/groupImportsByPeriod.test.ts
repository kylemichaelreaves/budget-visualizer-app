import { describe, expect, it } from 'vitest'
import { groupImportsByPeriod } from '@components/dataImport/helpers/groupImportsByPeriod'

describe('groupImportsByPeriod', () => {
  it('groups by month, most recent first, with the catch-all last', () => {
    const groups = groupImportsByPeriod(['2026_03.csv', 'notes.csv', '2026_04.csv', 'x_2026_04.csv'])
    expect(groups.map((g) => [g.label, g.files])).toEqual([
      ['April 2026', ['2026_04.csv', 'x_2026_04.csv']],
      ['March 2026', ['2026_03.csv']],
      ['Other files', ['notes.csv']],
    ])
  })

  // #85: an impossible month got its own "Other files" bucket keyed 2026_13,
  // which sorted above every real month.
  it('files an impossible month under the single catch-all at the bottom', () => {
    const groups = groupImportsByPeriod(['2026_13.csv', '2026_04.csv', 'notes.csv'])
    expect(groups.map((g) => [g.key, g.files])).toEqual([
      ['2026_04', ['2026_04.csv']],
      ['other', ['2026_13.csv', 'notes.csv']],
    ])
  })
})
