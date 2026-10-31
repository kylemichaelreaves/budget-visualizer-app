import { describe, expect, it } from 'vitest'
import type { LoanFormType } from '@types'
import { calculateLoanEstimate } from '@components/loan/helpers/calculateLoanEstimate'
import { validateLoanForm } from '@components/loan/helpers/validateLoanForm'
import { formatLoanDateInput, parseLoanDateInput } from '@components/loan/helpers/loanDateInput'

const form = (fields: Partial<LoanFormType>): LoanFormType => ({
  loanAmount: 10_000,
  interestRate: 6,
  loanTerm: 36,
  startDate: new Date(2026, 0, 15),
  ...fields,
})

/** Local calendar day, matching how the payoff date is shown. */
const localDay = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()]

describe('calculateLoanEstimate', () => {
  it('amortizes at a positive rate', () => {
    const e = calculateLoanEstimate(form({}))
    expect(e.monthlyPayment).toBeCloseTo(304.22, 2)
    expect(e.totalCost).toBeCloseTo(e.monthlyPayment * 36, 8)
    expect(e.totalInterest).toBeCloseTo(e.totalCost - 10_000, 8)
  })

  it('splits the principal evenly at 0%', () => {
    const e = calculateLoanEstimate(form({ interestRate: 0, loanTerm: 4, loanAmount: 1000 }))
    expect(e).toMatchObject({ monthlyPayment: 250, totalInterest: 0, totalCost: 1000 })
  })

  it('adds the term in calendar months', () => {
    expect(localDay(calculateLoanEstimate(form({ loanTerm: 36 })).payoffDate)).toEqual([2029, 1, 15])
  })

  // #87: setMonth(getMonth() + 1) from Jan 31 lands on Mar 3.
  it.each([
    [new Date(2026, 0, 31), 1, [2026, 2, 28]],
    [new Date(2028, 0, 31), 1, [2028, 2, 29]],
    [new Date(2026, 2, 31), 1, [2026, 4, 30]],
    [new Date(2026, 7, 31), 6, [2027, 2, 28]],
  ])('clamps the payoff day to the end of a shorter month (%s + %i)', (startDate, loanTerm, expected) => {
    expect(localDay(calculateLoanEstimate(form({ startDate, loanTerm })).payoffDate)).toEqual(expected)
  })

  it('does not mutate the start date', () => {
    const startDate = new Date(2026, 0, 31)
    calculateLoanEstimate(form({ startDate, loanTerm: 1 }))
    expect(localDay(startDate)).toEqual([2026, 1, 31])
  })
})

describe('validateLoanForm', () => {
  it('accepts a complete form, including 0% interest', () => {
    expect(validateLoanForm(form({}))).toEqual({})
    expect(validateLoanForm(form({ interestRate: 0 }))).toEqual({})
  })

  it.each([0, -500, Number.NaN, Number.POSITIVE_INFINITY])('rejects loan amount %s', (loanAmount) => {
    expect(validateLoanForm(form({ loanAmount }))).toHaveProperty('loanAmount')
  })

  it.each([-1, 100.1, Number.NaN])('rejects interest rate %s', (interestRate) => {
    expect(validateLoanForm(form({ interestRate }))).toHaveProperty('interestRate')
  })

  it('accepts the 100% bound', () => {
    expect(validateLoanForm(form({ interestRate: 100 }))).toEqual({})
  })

  it.each([0, -12, 12.5, Number.NaN])('rejects loan term %s', (loanTerm) => {
    expect(validateLoanForm(form({ loanTerm }))).toHaveProperty('loanTerm')
  })

  it('rejects an invalid start date', () => {
    expect(validateLoanForm(form({ startDate: new Date(Number.NaN) }))).toEqual({
      startDate: 'Choose a start date.',
    })
  })

  it('reports every invalid field at once', () => {
    expect(Object.keys(validateLoanForm(form({ loanAmount: 0, interestRate: -1, loanTerm: 0 })))).toEqual([
      'loanAmount',
      'interestRate',
      'loanTerm',
    ])
  })
})

describe('loan date input', () => {
  // #87: toISOString().slice(0, 10) showed tomorrow in New York after 8 pm.
  it('formats the local calendar day, not the UTC one', () => {
    const lateEvening = new Date(2026, 9, 30, 21, 30)
    expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-10-31')
    expect(formatLoanDateInput(lateEvening)).toBe('2026-10-30')
  })

  it('parses an input value to that local day', () => {
    const d = parseLoanDateInput('2026-03-01')
    expect(localDay(d)).toEqual([2026, 3, 1])
    expect(formatLoanDateInput(d)).toBe('2026-03-01')
  })

  it.each(['', '2026-02-30', 'tomorrow', '2026-3-1'])('treats %j as no date', (value) => {
    const d = parseLoanDateInput(value)
    expect(Number.isNaN(d.getTime())).toBe(true)
    expect(formatLoanDateInput(d)).toBe('')
  })
})
