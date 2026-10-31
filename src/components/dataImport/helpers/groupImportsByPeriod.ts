const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export type ImportGroup = { key: string; label: string; files: string[] }

// Filenames follow YYYY_MM.csv, so the period is derivable from the name itself —
// no extra API data is needed to group the list by month.
export function groupImportsByPeriod(files: string[]): ImportGroup[] {
  const byKey = new Map<string, ImportGroup>()
  for (const file of files) {
    const m = file.match(/(\d{4})[_-](\d{2})/)
    const monthIdx = m ? Number(m[2]) - 1 : -1
    // An impossible month (e.g. 2026_13) belongs in the catch-all, not in a
    // bucket of its own that sorts above every real month.
    const valid = m !== null && monthIdx >= 0 && monthIdx < 12
    const key = valid ? `${m[1]}_${m[2]}` : 'other'
    const label = valid ? `${MONTHS[monthIdx]} ${m[1]}` : 'Other files'
    if (!byKey.has(key)) byKey.set(key, { key, label, files: [] })
    byKey.get(key)!.files.push(file)
  }
  // Most-recent period first; the catch-all "other" bucket sinks to the bottom.
  return [...byKey.values()].sort((a, b) => {
    if (a.key === 'other') return 1
    if (b.key === 'other') return -1
    return b.key.localeCompare(a.key)
  })
}
