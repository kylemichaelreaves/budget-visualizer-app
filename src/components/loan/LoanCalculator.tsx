import { batch, createMemo, For } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { LoanFormType } from '@types'
import { devConsole } from '@utils/devConsole'
import LoanFormField, { type LoanFieldDef } from './LoanFormField'

type LoanEstimate = {
  monthlyPayment: number
  totalInterest: number
  totalCost: number
  payoffDate: number
}

const initialLoanForm: LoanFormType = {
  loanAmount: 0,
  interestRate: 0,
  loanTerm: 0,
  startDate: new Date(),
}

const loanFormFields: LoanFieldDef[] = [
  { label: 'Loan Amount', prop: 'loanAmount', placeholder: 'Enter loan amount', type: 'number' },
  {
    label: 'Interest Rate',
    prop: 'interestRate',
    placeholder: 'Enter interest rate',
    type: 'number',
    tooltip: 'Annual Interest Rate as a Percentage',
  },
  {
    label: 'Loan Term',
    prop: 'loanTerm',
    placeholder: 'Enter loan term',
    type: 'number',
    tooltip: 'Total Months of the Loan',
  },
  { label: 'Start Date', prop: 'startDate', placeholder: 'Select start date', type: 'date' },
]

export default function LoanCalculator() {
  const [loanForm, setLoanForm] = createStore<LoanFormType>({ ...initialLoanForm })
  const [loanEstimate, setLoanEstimate] = createStore<LoanEstimate>({
    monthlyPayment: 0,
    totalInterest: 0,
    totalCost: 0,
    payoffDate: Date.now(),
  })

  const isFormInitial = createMemo(
    () =>
      loanForm.loanAmount === initialLoanForm.loanAmount &&
      loanForm.interestRate === initialLoanForm.interestRate &&
      loanForm.loanTerm === initialLoanForm.loanTerm &&
      loanForm.startDate.getTime() === initialLoanForm.startDate.getTime(),
  )

  function calculateLoanEstimate() {
    const monthlyInterestRate = loanForm.interestRate / 100 / 12
    const numberOfPayments = loanForm.loanTerm
    const monthlyPayment =
      (monthlyInterestRate * loanForm.loanAmount) / (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments))

    setLoanEstimate('monthlyPayment', monthlyPayment)
    setLoanEstimate('totalInterest', monthlyPayment * numberOfPayments - loanForm.loanAmount)
    setLoanEstimate(
      'totalCost',
      loanForm.loanAmount + (monthlyPayment * numberOfPayments - loanForm.loanAmount),
    )

    const startDate = new Date(loanForm.startDate)
    startDate.setMonth(startDate.getMonth() + numberOfPayments)
    setLoanEstimate('payoffDate', startDate.getTime())
    devConsole('log', 'loanEstimate', loanEstimate)
  }

  function resetForm() {
    setLoanForm({ ...initialLoanForm, startDate: new Date(initialLoanForm.startDate) })
    setLoanEstimate({
      monthlyPayment: 0,
      totalInterest: 0,
      totalCost: 0,
      payoffDate: Date.now(),
    })
  }

  const payoffLabel = () => new Date(loanEstimate.payoffDate).toLocaleDateString()

  return (
    <section
      style={{
        width: 'min(100%, 520px)',
        padding: '20px',
        background: '#2c2c2c',
        'border-radius': '8px',
        color: '#ecf0f1',
      }}
    >
      <h2 style={{ 'margin-top': 0 }}>Loan Calculator</h2>
      <p style={{ color: '#bdc3c7', 'font-size': '0.9rem' }}>
        Monthly: {loanEstimate.monthlyPayment.toFixed(2)} · Interest: {loanEstimate.totalInterest.toFixed(2)}{' '}
        · Total cost: {loanEstimate.totalCost.toFixed(2)} · Payoff: {payoffLabel()}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          calculateLoanEstimate()
        }}
      >
        <For each={loanFormFields}>
          {(field) => (
            <LoanFormField
              field={field}
              model={loanForm}
              onChange={(m) =>
                batch(() => {
                  setLoanForm('loanAmount', m.loanAmount)
                  setLoanForm('interestRate', m.interestRate)
                  setLoanForm('loanTerm', m.loanTerm)
                  setLoanForm('startDate', m.startDate)
                })
              }
            />
          )}
        </For>
        <div style={{ display: 'flex', gap: '10px', 'margin-top': '16px' }}>
          <button type="submit" disabled={isFormInitial()}>
            Calculate
          </button>
          <button type="button" onClick={resetForm} disabled={isFormInitial()}>
            Reset
          </button>
        </div>
      </form>
    </section>
  )
}
