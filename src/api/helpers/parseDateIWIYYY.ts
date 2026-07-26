import { DateTime } from 'luxon'
import { devConsole } from '@utils/devConsole'
import { TWO_DIGIT_DASH_YEAR_PATTERN } from '@api/helpers/periodValueFormat'

/**
 * Parses a week filter value in `IW-YYYY` form (ISO week number and ISO week
 * year) into the UTC start of that week.
 *
 * The caller must already know it holds a *week* value: this shape is
 * indistinguishable from the `MM-YYYY` month form for leading values 01–12, and
 * `parseDateMMYYYY` will accept the same string and return a different date. See
 * {@link TWO_DIGIT_DASH_YEAR_PATTERN}.
 *
 * @param input - The week string to parse.
 * @returns A Date at the UTC start of the ISO week, or `null` if malformed.
 */
// used by the DailyIntervalLineChart
export function parseDateIWIYYY(input: string): Date | null {
  const match = TWO_DIGIT_DASH_YEAR_PATTERN.exec(input)

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
