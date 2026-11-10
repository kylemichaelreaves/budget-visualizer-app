import { describe, expect, it } from 'vitest'
import { isValidImportFilename } from '@components/dataImport/helpers/isValidImportFilename'

describe('isValidImportFilename', () => {
  it.each(['2026_01.csv', '2026_12.csv', '1999_07.csv'])('accepts %s', (name) => {
    expect(isValidImportFilename(name)).toBe(true)
  })

  it.each([
    '2026_00.csv',
    '2026_13.csv',
    '2026_4.csv',
    '2026-04.csv',
    'chase_2026_04.csv',
    '2026_04.csv.txt',
    'export.csv',
    // resourceQuerier's CSV_FILENAME_PATTERN is case-sensitive and 400s these.
    '2026_05.CSV',
    '2026_05.Csv',
  ])('rejects %s', (name) => {
    expect(isValidImportFilename(name)).toBe(false)
  })
})
