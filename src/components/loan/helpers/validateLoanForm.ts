import type { LoanFormType } from '@types'

export type LoanFormErrors = Partial<Record<'loanAmount' | 'interestRate' | 'loanTerm' | 'startDate', string>>

/** Field-level errors for the loan form; an empty object means it can be calculated. */
export function validateLoanForm(form: LoanFormType): LoanFormErrors {
  const errors: LoanFormErrors = {}
  if (!Number.isFinite(form.loanAmount) || form.loanAmount <= 0)
    errors.loanAmount = 'Enter an amount greater than 0.'
  if (!Number.isFinite(form.interestRate) || form.interestRate < 0 || form.interestRate > 100)
    errors.interestRate = 'Enter a rate between 0 and 100%.'
  if (!Number.isInteger(form.loanTerm) || form.loanTerm < 1)
    errors.loanTerm = 'Enter a whole number of months, at least 1.'
  if (!(form.startDate instanceof Date) || Number.isNaN(form.startDate.getTime()))
    errors.startDate = 'Choose a start date.'
  return errors
}
