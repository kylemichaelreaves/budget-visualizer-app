import { DateTime } from 'luxon'

/**
 * Gets the ISO week numbers for each week in a given month of a specific year.
 *
 * @param {number} year - The year for which to get the ISO weeks.
 * @param {number} month - The month (1-12) for which to get the ISO weeks.
 * @returns {number[]} - An array of ISO week numbers for the specified month.
 */
export default function getIsoWeeksOfMonth(year: number, month: number): number[] {
  const weeks: number[] = []

  if (year < 1) {
    return []
  }

  let startOfWeek = DateTime.utc(year, month).startOf('month').startOf('week')

  const endOfMonth = DateTime.utc(year, month).endOf('month')

  while (startOfWeek <= endOfMonth) {
    weeks.push(startOfWeek.weekNumber)
    startOfWeek = startOfWeek.plus({ weeks: 1 })
  }

  return weeks
}
