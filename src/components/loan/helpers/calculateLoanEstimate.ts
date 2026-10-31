import { DateTime } from 'luxon'
import type { LoanFormType } from '@types'

export type LoanEstimate = {
  monthlyPayment: number
  totalInterest: number
  totalCost: number
  payoffDate: Date
}

/**
 * Amortized estimate for a form that has already passed `validateLoanForm`.
 *
 * The payoff date is `startDate` plus `loanTerm` calendar months in the local
 * zone. Luxon clamps to the end of a shorter month, so Jan 31 + 1 month is
 * Feb 28, where `Date#setMonth` would overflow to early March.
 */
export function calculateLoanEstimate(form: LoanFormType): LoanEstimate {
  const n = form.loanTerm
  const monthlyRate = form.interestRate / 100 / 12
  // 0% interest collapses the amortization formula's denominator to zero; split the principal evenly instead.
  const monthlyPayment =
    monthlyRate === 0
      ? form.loanAmount / n
      : (monthlyRate * form.loanAmount) / (1 - Math.pow(1 + monthlyRate, -n))
  const totalCost = monthlyPayment * n

  return {
    monthlyPayment,
    totalInterest: totalCost - form.loanAmount,
    totalCost,
    payoffDate: DateTime.fromJSDate(form.startDate).plus({ months: n }).toJSDate(),
  }
}
