import { Navigate, Route, Router } from '@solidjs/router'
import { type JSX, lazy, Suspense } from 'solid-js'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'
import NavBar from '@components/layout/NavBar'

// Each page is its own chunk, fetched on first visit, so the login screen doesn't
// download the charts, d3 and every other page. The shell (NavBar, BudgetVisualizer)
// stays in the entry chunk because every authenticated route renders it.
const CreateUserPage = lazy(() => import('@components/auth/CreateUserPage'))
const Login = lazy(() => import('@components/auth/Login'))
const LoanCalculator = lazy(() => import('@components/loan/LoanCalculator'))
const MemoEditPage = lazy(() => import('@components/memos/forms/MemoEditPage'))
const MemoSummaryPage = lazy(() => import('@components/memos/summaries/MemoSummaryPage'))
const MemosTable = lazy(() => import('@components/memos/table/MemosTable'))
const BudgetCategoriesPage = lazy(() => import('@components/budgetCategories/BudgetCategoriesPage'))
const DataImportPage = lazy(() => import('@components/dataImport/DataImportPage'))
const AccountSettingsPage = lazy(() => import('@components/settings/AccountSettingsPage'))
const RecurringPage = lazy(() => import('@components/recurring/RecurringPage'))
const PendingTransactionsTable = lazy(
  () => import('@components/transactions/pending/PendingTransactionsTable'),
)
const TransactionEditPage = lazy(() => import('@components/transactions/forms/TransactionEditPage'))
const TransactionsTable = lazy(() => import('@components/transactions/table/TransactionsTable'))
const TransactionsWithTimeframeSummaryRoute = lazy(
  () => import('@components/transactions/summaries/TransactionsWithTimeframeSummaryRoute'),
)
const ObservabilityRoute = lazy(() => import('@components/observability/ObservabilityRoute'))

function AppLayout(props: { children?: JSX.Element }) {
  return (
    <>
      <NavBar />
      {/* Covers the public pages (login, register). Authenticated
          pages suspend inside BudgetVisualizer's own boundary, so the sidebar
          stays up while a page chunk loads. */}
      <Suspense>{props.children}</Suspense>
    </>
  )
}

export default function App() {
  return (
    <Router root={AppLayout}>
      <Route path="/login" component={Login} />
      <Route path="/register" component={CreateUserPage} />
      <Route path="/" component={() => <Navigate href="/budget-visualizer/transactions" />} />
      <Route path="/budget-visualizer" component={BudgetVisualizer}>
        <Route path="/" component={() => <Navigate href="/budget-visualizer/transactions" />} />
        <Route path="/transactions" component={TransactionsTable} />
        <Route path="/transactions/months/:month/summary" component={TransactionsWithTimeframeSummaryRoute} />
        <Route path="/transactions/weeks/:week/summary" component={TransactionsWithTimeframeSummaryRoute} />
        <Route path="/transactions/pending" component={PendingTransactionsTable} />
        <Route path="/transactions/pending/:pendingTransactionId/edit" component={TransactionEditPage} />
        <Route path="/transactions/:transactionId/edit" component={TransactionEditPage} />
        <Route path="/memos" component={MemosTable} />
        <Route path="/memos/:memoId/summary" component={MemoSummaryPage} />
        <Route path="/memos/:memoId/edit" component={MemoEditPage} />
        <Route path="/recurring" component={RecurringPage} />
        <Route path="/budget-categories" component={BudgetCategoriesPage} />
        <Route path="/transactions/csv" component={DataImportPage} />
        <Route path="/loan-calculator" component={LoanCalculator} />
        <Route path="/account" component={AccountSettingsPage} />
        <Route path="/observability" component={ObservabilityRoute} />
      </Route>
    </Router>
  )
}
