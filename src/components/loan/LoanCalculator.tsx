import { createMemo, createSignal, For, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { LoanFormType } from '@types'
import LoanFormField, { type LoanFieldDef } from './LoanFormField'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { formatUsd } from '@utils/formatUsd'
import { calculateLoanEstimate, type LoanEstimate } from './helpers/calculateLoanEstimate'
import { validateLoanForm, type LoanFormErrors } from './helpers/validateLoanForm'

type LoanFieldKey = keyof LoanFormErrors

const loanFormFields: (LoanFieldDef & { prop: LoanFieldKey })[] = [
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

const freshLoanForm = (): LoanFormType => ({
  loanAmount: 0,
  interestRate: 0,
  loanTerm: 0,
  startDate: new Date(),
})

export default function LoanCalculator() {
  const initial = freshLoanForm()
  const [loanForm, setLoanForm] = createStore<LoanFormType>({ ...initial })
  const [touched, setTouched] = createStore<Partial<Record<LoanFieldKey, boolean>>>({})
  // Cleared on every input change, so the header never shows an estimate for other inputs.
  const [estimate, setEstimate] = createSignal<LoanEstimate | null>(null)

  const errors = createMemo(() => validateLoanForm(loanForm))
  const isValid = () => Object.keys(errors()).length === 0
  const visibleError = (prop: LoanFieldKey) => (touched[prop] ? errors()[prop] : undefined)
  const hasVisibleErrors = () => loanFormFields.some((f) => visibleError(f.prop))

  const isFormInitial = createMemo(
    () =>
      loanForm.loanAmount === initial.loanAmount &&
      loanForm.interestRate === initial.interestRate &&
      loanForm.loanTerm === initial.loanTerm &&
      loanForm.startDate.getTime() === initial.startDate.getTime(),
  )

  function updateField(prop: LoanFieldKey, next: LoanFormType) {
    setLoanForm(prop, next[prop])
    setTouched(prop, true)
    setEstimate(null)
  }

  function calculate() {
    // Submitting reveals every remaining error, including fields never edited.
    setTouched({ loanAmount: true, interestRate: true, loanTerm: true, startDate: true })
    if (!isValid()) return
    setEstimate(calculateLoanEstimate(loanForm))
  }

  function resetForm() {
    setLoanForm({ ...initial })
    setTouched({ loanAmount: false, interestRate: false, loanTerm: false, startDate: false })
    setEstimate(null)
  }

  return (
    <Card class="w-full max-w-[520px]">
      <CardHeader>
        <CardTitle>Loan Calculator</CardTitle>
        <p class="text-sm text-muted-foreground" aria-live="polite" data-testid="loan-estimate">
          <Show when={estimate()} fallback="Enter the loan details, then calculate.">
            {(e) => (
              <>
                Monthly: {formatUsd(e().monthlyPayment)} · Interest: {formatUsd(e().totalInterest)} · Total
                cost: {formatUsd(e().totalCost)} · Payoff: {e().payoffDate.toLocaleDateString()}
              </>
            )}
          </Show>
        </p>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            calculate()
          }}
        >
          <For each={loanFormFields}>
            {(field) => (
              <LoanFormField
                field={field}
                model={loanForm}
                error={visibleError(field.prop)}
                onChange={(m) => updateField(field.prop, m)}
              />
            )}
          </For>
          <div class="flex gap-2.5 mt-4">
            <Button type="submit" disabled={isFormInitial() || hasVisibleErrors()}>
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
