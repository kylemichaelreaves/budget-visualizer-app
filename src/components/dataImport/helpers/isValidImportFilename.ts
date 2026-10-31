// Recent imports are grouped by the month in the name, so the month has to be
// real: `2026_13.csv` would upload fine and then be filed under "Other files".
const IMPORT_FILENAME_PATTERN = /^\d{4}_(0[1-9]|1[0-2])\.csv$/i

/** True for `YYYY_MM.csv` with a month of 01–12. */
export function isValidImportFilename(name: string): boolean {
  return IMPORT_FILENAME_PATTERN.test(name)
}
