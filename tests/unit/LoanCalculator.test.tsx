import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import LoanCalculator from '@components/loan/LoanCalculator'

const input = (id: string) => document.getElementById(`loan-${id}`) as HTMLInputElement
const type = (id: string, value: string) => fireEvent.input(input(id), { target: { value } })
const calculateButton = () => screen.getByRole('button', { name: 'Calculate' })
const estimate = () => screen.getByTestId('loan-estimate')

function fillValid() {
  type('loanAmount', '12000')
  type('interestRate', '0')
  type('loanTerm', '12')
  type('startDate', '2026-01-31')
}

describe('LoanCalculator', () => {
  it('shows a prompt, not a $0 estimate, before calculating', () => {
    render(() => <LoanCalculator />)
    expect(estimate()).toHaveTextContent('Enter the loan details, then calculate.')
    expect(estimate()).toHaveAttribute('aria-live', 'polite')
    expect(calculateButton()).toBeDisabled()
  })

  it('calculates a valid form, with a month-end-clamped payoff date', () => {
    render(() => <LoanCalculator />)
    fillValid()
    fireEvent.click(calculateButton())
    expect(estimate()).toHaveTextContent('Monthly: $1,000.00')
    expect(estimate()).toHaveTextContent('Total cost: $12,000.00')
    expect(estimate()).toHaveTextContent(`Payoff: ${new Date(2027, 0, 31).toLocaleDateString()}`)
  })

  it('shows the error only for a field that was edited, and wires it to the input', () => {
    render(() => <LoanCalculator />)
    type('loanAmount', '-5')
    expect(screen.getByTestId('loan-loanAmount-error')).toHaveTextContent('greater than 0')
    expect(input('loanAmount')).toHaveAttribute('aria-invalid', 'true')
    expect(input('loanAmount')).toHaveAttribute('aria-describedby', 'loan-loanAmount-error')
    expect(screen.queryByTestId('loan-loanTerm-error')).toBeNull()
    expect(calculateButton()).toBeDisabled()
  })

  it.each([
    ['interestRate', '150', 'between 0 and 100'],
    ['loanTerm', '12.5', 'whole number of months'],
    ['startDate', '', 'Choose a start date'],
  ])('rejects %s = %j', (field, value, message) => {
    render(() => <LoanCalculator />)
    fillValid()
    type(field, value)
    expect(screen.getByTestId(`loan-${field}-error`)).toHaveTextContent(message)
    expect(calculateButton()).toBeDisabled()
  })

  it('reveals errors on fields never edited when Calculate is pressed', () => {
    render(() => <LoanCalculator />)
    type('loanAmount', '1000')
    type('interestRate', '5')
    fireEvent.click(calculateButton())
    expect(screen.getByTestId('loan-loanTerm-error')).toBeInTheDocument()
    expect(estimate()).toHaveTextContent('Enter the loan details')
  })

  // #87: the header used to keep the previous estimate after the inputs changed.
  it('clears the estimate as soon as an input changes', () => {
    render(() => <LoanCalculator />)
    fillValid()
    fireEvent.click(calculateButton())
    expect(estimate()).toHaveTextContent('Monthly:')
    type('loanTerm', '24')
    expect(estimate()).toHaveTextContent('Enter the loan details, then calculate.')
  })

  it('reset clears inputs, errors and the estimate', () => {
    render(() => <LoanCalculator />)
    fillValid()
    fireEvent.click(calculateButton())
    type('loanAmount', '-1')
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.queryByTestId('loan-loanAmount-error')).toBeNull()
    expect(input('loanAmount').value).toBe('')
    expect(estimate()).toHaveTextContent('Enter the loan details')
    expect(calculateButton()).toBeDisabled()
  })
})
