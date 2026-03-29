import { describe, expect, it } from 'vitest'
import {
  formatDayLabel,
  formatWeekLabel,
  formatMonthLabel,
  formatYearLabel,
  getPeriodLabel,
} from '@api/helpers/formatPeriodLabels'

describe('formatPeriodLabels', () => {
  describe('formatDayLabel', () => {
    it('formats an ISO date as weekday, month day, year', () => {
      expect(formatDayLabel('2025-01-15')).toBe('Wed, Jan 15, 2025')
    })

    it('returns input for invalid date', () => {
      expect(formatDayLabel('not-a-date')).toBe('not-a-date')
    })
  })

  describe('formatWeekLabel', () => {
    it('formats a week-year as date range', () => {
      const label = formatWeekLabel('03-2025')
      expect(label).toContain('Jan')
      expect(label).toContain('2025')
      expect(label).toContain('–')
    })

    it('returns input for invalid format', () => {
      expect(formatWeekLabel('bad')).toBe('bad')
    })
  })

  describe('formatMonthLabel', () => {
    it('formats MM-yyyy as full month and year', () => {
      expect(formatMonthLabel('01-2025')).toBe('January 2025')
    })

    it('formats December correctly', () => {
      expect(formatMonthLabel('12-2024')).toBe('December 2024')
    })

    it('returns input for invalid format', () => {
      expect(formatMonthLabel('bad')).toBe('bad')
    })
  })

  describe('formatYearLabel', () => {
    it('returns the year as-is', () => {
      expect(formatYearLabel('2025')).toBe('2025')
    })
  })

  describe('getPeriodLabel', () => {
    it('dispatches to day formatter', () => {
      expect(getPeriodLabel('day', '2025-01-15')).toBe('Wed, Jan 15, 2025')
    })

    it('dispatches to month formatter', () => {
      expect(getPeriodLabel('month', '01-2025')).toBe('January 2025')
    })

    it('dispatches to year formatter', () => {
      expect(getPeriodLabel('year', '2025')).toBe('2025')
    })

    it('returns empty string for null viewMode', () => {
      expect(getPeriodLabel(null, '')).toBe('')
    })

    it('returns empty string for memo viewMode', () => {
      expect(getPeriodLabel('memo', 'some memo')).toBe('')
    })
  })
})
