import { DateTime } from 'luxon'

// used by the DailyIntervalLineChart
export function parseDateMMYYYY(input: string) {
  // regex to match the format MM-YYYY
  const regex = /^(\d{2})-(\d{4})$/
  const match = regex.exec(input)

  if (!match) {
    return null
  }

  const parts = input.split('-')
  if (parts.length !== 2) {
    return null
  }

  // Ensure parts exist before parsing
  const monthStr = parts[0]
  const yearStr = parts[1]

  if (!monthStr || !yearStr) {
    return null
  }

  const month = parseInt(monthStr, 10)
  const year = parseInt(yearStr, 10)

  // Validate that parsing was successful and values are valid
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return null
  }

  const dt = DateTime.fromObject({ year: year, month: month, day: 1 }, { zone: 'UTC' })

  if (dt.isValid) {
    return dt.toJSDate()
  }

  return null
}
