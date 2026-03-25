import { DateTime } from 'luxon'

/**
 * Splits a week string in the "IW-YYYY" format and returns the start and end dates of that week.
 *
 * @param weekString - The week string in "IW-YYYY" format.
 * @returns An object containing the start and end dates of the week.
 */
// used by the WeekSummaryTable
export function getWeekRange(weekString: string) {
  const [week, year] = weekString.split('-').map(Number)
  const startDate = DateTime.fromObject(
    {
      weekYear: year,
      weekNumber: week,
    },
    { zone: 'UTC' },
  ).startOf('week')
  const endDate = startDate.endOf('week')

  return {
    startDate: startDate.toFormat('cccc MMMM dd'),
    endDate: endDate.toFormat('cccc MMMM dd'),
  }
}
