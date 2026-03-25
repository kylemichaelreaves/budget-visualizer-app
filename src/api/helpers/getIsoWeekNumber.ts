import { DateTime } from 'luxon'
/**
 * Gets the ISO week number for a given date.
 *
 * @param {Date} date - The date for which to get the ISO week number.
 * @returns {number} - The ISO week number for the specified date.
 */
// used by BudgetCategoryHistoricalLineChart
export function getIsoWeekNumber(date: Date): number {
  // Convert the JavaScript Date object to a Luxon DateTime object
  const dt = DateTime.fromJSDate(date)
  // Get the ISO week number
  return dt.weekNumber
}
