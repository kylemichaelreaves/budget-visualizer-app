import { DateTime } from 'luxon'
import { devConsole } from '@utils/devConsole'

/**
 * Parses a date string in the format WW-YYYY (ISO week number and year) and returns a Date object.
 *
 * @param {string} input - The date string to parse.
 * @returns {Date | null} - A Date object if the input is valid, otherwise null.
 */

// used by the DailyIntervalLineChart
export function parseDateIWIYYY(input: string): Date | null {
  // regex to match the format WW-YYYY
  const regex = /^(\d{2})-(\d{4})$/
  const match = RegExp(regex).exec(input)

  if (!match) {
    return null
  }

  // Ensure match groups exist before parsing
  const weekStr = match[1]
  const yearStr = match[2]

  if (!weekStr || !yearStr) {
    return null
  }

  const weekNumber = parseInt(weekStr, 10)
  const weekYear = parseInt(yearStr, 10)

  // Validate that parsing was successful and values are valid
  if (isNaN(weekNumber) || isNaN(weekYear) || weekNumber < 1 || weekNumber > 53) {
    return null
  }

  const dt = DateTime.fromObject({ weekYear, weekNumber }, { zone: 'UTC' })

  if (!dt.isValid) {
    devConsole('error', dt.invalidReason)
    return null
  }

  return dt.toJSDate()
}
