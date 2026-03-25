/**
 * Calculates the week number for a given date.
 *
 * @param {Date} date - The date for which to calculate the week number.
 * @returns {number} - The week number of the given date.
 */
export function getWeekNumber(date: Date): number {
  // Get the first day of the year
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)

  // Calculate the number of milliseconds between the given date and the first day of the year
  // Then convert it to days by dividing by the number of milliseconds in a day (86400000)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000

  // Calculate the week number by adding the day of the week of the first day of the year (0-6)
  // to the number of days passed in the year, adding 1 to make the first day of the year count as a whole day
  // and then dividing by 7 (the number of days in a week), rounding up to the nearest whole number
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
