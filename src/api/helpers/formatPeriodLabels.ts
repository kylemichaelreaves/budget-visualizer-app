import { DateTime } from 'luxon'
import type { ViewMode } from '@types'

export function formatDayLabel(dayIso: string): string {
  const dt = DateTime.fromISO(dayIso, { zone: 'utc' })
  if (!dt.isValid) return dayIso
  return dt.toFormat('ccc, LLL d, yyyy')
}

export function formatWeekLabel(weekYear: string): string {
  const parts = weekYear.split('-')
  if (parts.length !== 2) return weekYear
  const [weekStr, yearStr] = parts
  const week = Number(weekStr)
  const year = Number(yearStr)
  if (!Number.isFinite(week) || !Number.isFinite(year)) return weekYear

  const start = DateTime.fromObject({ weekYear: year, weekNumber: week }, { zone: 'utc' })
  if (!start.isValid) return weekYear
  const end = start.plus({ days: 6 })
  return `${start.toFormat('LLL d')} – ${end.toFormat('LLL d')}, ${start.year}`
}

export function formatMonthLabel(monthYear: string): string {
  const parts = monthYear.split('-')
  if (parts.length !== 2) return monthYear
  const [monthStr, yearStr] = parts
  const month = Number(monthStr)
  const year = Number(yearStr)
  if (!Number.isFinite(month) || !Number.isFinite(year)) return monthYear

  const dt = DateTime.fromObject({ year, month }, { zone: 'utc' })
  if (!dt.isValid) return monthYear
  return dt.toFormat('LLLL yyyy')
}

export function formatYearLabel(year: string): string {
  return year
}

export function getPeriodLabel(viewMode: ViewMode, value: string): string {
  if (!value) return ''
  switch (viewMode) {
    case 'day':
      return formatDayLabel(value)
    case 'week':
      return formatWeekLabel(value)
    case 'month':
      return formatMonthLabel(value)
    case 'year':
      return formatYearLabel(value)
    default:
      return ''
  }
}
