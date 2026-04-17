import { batch, createMemo, For } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { LoanFormType } from '@types'
import { devConsole } from '@utils/devConsole'
import LoanFormField, { type LoanFieldDef } from './LoanFormField'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { formatUsd } from '@utils/formatUsd'

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
    // Zero or negative term is meaningless and would produce Infinity/NaN via either branch below.
    if (numberOfPayments <= 0 || loanForm.loanAmount <= 0) {
      setLoanEstimate({ monthlyPayment: 0, totalInterest: 0, totalCost: 0, payoffDate: Date.now() })
      return
    }
    // 0% interest collapses the amortization formula's denominator to zero; split loanAmount evenly instead.
    const monthlyPayment =
      monthlyInterestRate === 0
        ? loanForm.loanAmount / numberOfPayments
        : (monthlyInterestRate * loanForm.loanAmount) /
          (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments))

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
    <Card class="w-full max-w-[520px]">
      <CardHeader>
        <CardTitle>Loan Calculator</CardTitle>
        <p class="text-sm text-muted-foreground">
          Monthly: {formatUsd(loanEstimate.monthlyPayment)} · Interest:{' '}
          {formatUsd(loanEstimate.totalInterest)} · Total cost: {formatUsd(loanEstimate.totalCost)} · Payoff:{' '}
          {payoffLabel()}
        </p>
      </CardHeader>
      <CardContent>
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
          <div class="flex gap-2.5 mt-4">
            <Button type="submit" disabled={isFormInitial()}>
              Calculate
            </Button>
            <Button variant="outline" type="button" onClick={resetForm} disabled={isFormInitial()}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
