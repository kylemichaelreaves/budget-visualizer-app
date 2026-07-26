/**
 * Both period filter values the app puts in the URL and store share one wire
 * shape: two digits, a dash, four digits.
 *
 *   month filter (`?month=`) -> `MM-YYYY`, e.g. `05-2026`
 *   week filter  (`?week=`)  -> `IW-YYYY`, e.g. `05-2026` (ISO week 5)
 *
 * They are therefore **indistinguishable by inspection** for the leading values
 * 01–12: `05-2026` is a well-formed month *and* a well-formed ISO week, and
 * `parseDateMMYYYY` / `parseDateIWIYYY` will each happily accept it and return
 * completely different dates.
 *
 * Nothing recovers the meaning from the string — the caller must already know
 * which kind of value it holds. Today every caller does, because the value comes
 * from a discriminated source (`transactionsState.selectedMonth` vs
 * `selectedWeek`, or the `month=` vs `week=` query param). Keep it that way: do
 * not add a helper that "detects" the format, and do not pass one of these
 * strings through a channel that has lost the month/week distinction.
 */
export const TWO_DIGIT_DASH_YEAR_PATTERN = /^(\d{2})-(\d{4})$/
