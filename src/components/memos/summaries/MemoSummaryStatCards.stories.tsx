import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import type { MemoSummaryCreditAggregate, MemoSummaryDebitAggregate } from './memoSummaryStatCardTypes'
import MemoSummaryStatCards from './MemoSummaryStatCards'

const defaultCredits: MemoSummaryCreditAggregate = {
  sum: 2500.0,
  creditTxnCount: 3,
  aggregateScope: 'memo',
}

const defaultDebits: MemoSummaryDebitAggregate = {
  sum: 1234.56,
  debitTxnCount: 15,
  aggregateScope: 'memo',
}

const meta = {
  title: 'Memos/MemoSummaryStatCards',
  component: MemoSummaryStatCards,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MemoSummaryStatCards>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [ambiguous, setAmbiguous] = createSignal(false)
    const [recurring, setRecurring] = createSignal(false)
    const [necessary, setNecessary] = createSignal(true)
    const [frequency, setFrequency] = createSignal<string | undefined>(undefined)
    return (
      <MemoSummaryStatCards
        totalCredits={() => defaultCredits}
        totalDebits={() => defaultDebits}
        budgetCategory={() => 'Food - Groceries'}
        memoReady={() => true}
        saving={() => false}
        onOpenCategoryDialog={() => {}}
        onAmbiguousChange={setAmbiguous}
        onRecurringChange={setRecurring}
        onNecessaryChange={setNecessary}
        onFrequencyChange={setFrequency}
        isAmbiguous={ambiguous}
        isRecurring={recurring}
        isNecessary={necessary}
        frequency={frequency}
      />
    )
  },
}

export const Saving: Story = {
  render: () => (
    <MemoSummaryStatCards
      totalCredits={() => defaultCredits}
      totalDebits={() => defaultDebits}
      budgetCategory={() => 'Food - Groceries'}
      memoReady={() => true}
      saving={() => true}
      onOpenCategoryDialog={() => {}}
      onAmbiguousChange={() => {}}
      onRecurringChange={() => {}}
      onNecessaryChange={() => {}}
      onFrequencyChange={() => {}}
      isAmbiguous={() => false}
      isRecurring={() => false}
      isNecessary={() => false}
      frequency={() => undefined}
    />
  ),
}

export const NoCategory: Story = {
  render: () => (
    <MemoSummaryStatCards
      totalCredits={() => defaultCredits}
      totalDebits={() => defaultDebits}
      budgetCategory={() => null}
      memoReady={() => true}
      saving={() => false}
      onOpenCategoryDialog={() => {}}
      onAmbiguousChange={() => {}}
      onRecurringChange={() => {}}
      onNecessaryChange={() => {}}
      onFrequencyChange={() => {}}
      isAmbiguous={() => false}
      isRecurring={() => false}
      isNecessary={() => false}
      frequency={() => undefined}
    />
  ),
}

export const WithRecurring: Story = {
  render: () => {
    const [frequency, setFrequency] = createSignal<string | undefined>('monthly')
    return (
      <MemoSummaryStatCards
        totalCredits={() => defaultCredits}
        totalDebits={() => defaultDebits}
        budgetCategory={() => 'Housing - Rent'}
        memoReady={() => true}
        saving={() => false}
        onOpenCategoryDialog={() => {}}
        onAmbiguousChange={() => {}}
        onRecurringChange={() => {}}
        onNecessaryChange={() => {}}
        onFrequencyChange={setFrequency}
        isAmbiguous={() => false}
        isRecurring={() => true}
        isNecessary={() => true}
        frequency={frequency}
      />
    )
  },
}
