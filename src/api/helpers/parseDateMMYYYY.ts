import { DateTime } from 'luxon'
import { TWO_DIGIT_DASH_YEAR_PATTERN } from '@api/helpers/periodValueFormat'

/**
 * Parses a month filter value in `MM-YYYY` form into the UTC first of that month.
 *
 * The caller must already know it holds a *month* value: this shape is
 * indistinguishable from the `IW-YYYY` week form for leading values 01–12, and
 * `parseDateIWIYYY` will accept the same string and return a different date. See
 * {@link TWO_DIGIT_DASH_YEAR_PATTERN}.
 *
 * @param input - The month string to parse.
 * @returns A Date at the UTC first of the month, or `null` if malformed.
 */
// used by the DailyIntervalLineChart
export function parseDateMMYYYY(input: string) {
  const match = TWO_DIGIT_DASH_YEAR_PATTERN.exec(input)

  if (!match) {
    return null
  }

  const monthStr = match[1]
  const yearStr = match[2]

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
