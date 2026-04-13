import { Navigate, Route, Router } from '@solidjs/router'
import Login from '@components/auth/Login'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'
import NavBar from '@components/layout/NavBar'
import LoanCalculator from '@components/loan/LoanCalculator'
import MemoEditPage from '@components/memos/MemoEditPage'
import MemoSummaryPage from '@components/memos/MemoSummaryPage'
import MemosTable from '@components/memos/MemosTable'
import BudgetCategoriesPage from '@components/budgetCategories/BudgetCategoriesPage'
import PendingTransactionsTable from '@components/transactions/PendingTransactionsTable'
import TransactionEditPage from '@components/transactions/TransactionEditPage'
import TransactionsTable from '@components/transactions/table/TransactionsTable'
import TransactionsWithMonthSummary from '@components/transactions/TransactionsWithMonthSummary'
import TransactionsWithWeekSummary from '@components/transactions/TransactionsWithWeekSummary'
import type { JSX } from 'solid-js'

function AppLayout(props: { children?: JSX.Element }) {
  return (
    <>
      <NavBar />
      {props.children}
    </>
  )
}

export default function App() {
  return (
    <Router root={AppLayout}>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <Navigate href="/budget-visualizer/transactions" />} />
      <Route path="/budget-visualizer" component={BudgetVisualizer}>
        <Route path="/" component={() => <Navigate href="/budget-visualizer/transactions" />} />
        <Route path="/transactions" component={TransactionsTable} />
        <Route path="/transactions/months/:month/summary" component={TransactionsWithMonthSummary} />
        <Route path="/transactions/weeks/:week/summary" component={TransactionsWithWeekSummary} />
        <Route path="/transactions/pending" component={PendingTransactionsTable} />
        <Route path="/transactions/pending/:pendingTransactionId/edit" component={TransactionEditPage} />
        <Route path="/transactions/:transactionId/edit" component={TransactionEditPage} />
        <Route path="/memos" component={MemosTable} />
        <Route path="/memos/:memoId/summary" component={MemoSummaryPage} />
        <Route path="/memos/:memoId/edit" component={MemoEditPage} />
        <Route path="/budget-categories" component={BudgetCategoriesPage} />
        <Route path="/loan-calculator" component={LoanCalculator} />
      </Route>
    </Router>
  )
}
