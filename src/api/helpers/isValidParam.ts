export function isValidParam(key: string, value: unknown): boolean {
  if (value === undefined) return false
  if (key === 'memo' && value === '') return false
  if (key === 'memoId' && (value === 0 || value === null)) return false
  return !(
    key === 'date' &&
    ((typeof value === 'number' && Number.isNaN(value)) ||
      (value instanceof Date && Number.isNaN(value.getTime())))
  )
}
