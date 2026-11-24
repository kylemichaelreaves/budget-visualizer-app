import { createRouter } from '@solidjs/router'
import { lazy, Loading } from 'solid-js'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'
import NavBar from '@components/layout/NavBar'
import Redirect from '@components/shared/Redirect'
import type { JSX } from '@solidjs/web'

// Each page is its own chunk, fetched on first visit, so the login screen doesn't
// download the charts, d3 and every other page. The shell (NavBar, BudgetVisualizer)
// stays in the entry chunk because every authenticated route renders it.
const CreateUserPage = lazy(() => import('@components/auth/CreateUserPage'))
const ForgotPasswordPage = lazy(() => import('@components/auth/ForgotPasswordPage'))
const Login = lazy(() => import('@components/auth/Login'))
const ResetPasswordPage = lazy(() => import('@components/auth/ResetPasswordPage'))
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
      {/* Covers the public pages (login, register, password reset). Authenticated
          pages suspend inside BudgetVisualizer's own boundary, so the sidebar
          stays up while a page chunk loads. */}
      <Loading>{props.children}</Loading>
    </>
  )
}

const toTransactions = () => <Redirect href="/budget-visualizer/transactions" />

const Router = createRouter({
  routes: [
    { path: '/login', component: Login },
    { path: '/register', component: CreateUserPage },
    { path: '/password/reset', component: ForgotPasswordPage },
    { path: '/password/confirm', component: ResetPasswordPage },
    { path: '/', component: toTransactions },
    {
      path: '/budget-visualizer',
      component: BudgetVisualizer,
      children: [
        { path: '/', component: toTransactions },
        { path: '/transactions', component: TransactionsTable },
        { path: '/transactions/months/:month/summary', component: TransactionsWithTimeframeSummaryRoute },
        { path: '/transactions/weeks/:week/summary', component: TransactionsWithTimeframeSummaryRoute },
        { path: '/transactions/pending', component: PendingTransactionsTable },
        { path: '/transactions/pending/:pendingTransactionId/edit', component: TransactionEditPage },
        { path: '/transactions/:transactionId/edit', component: TransactionEditPage },
        { path: '/memos', component: MemosTable },
        { path: '/memos/:memoId/summary', component: MemoSummaryPage },
        { path: '/memos/:memoId/edit', component: MemoEditPage },
        { path: '/recurring', component: RecurringPage },
        { path: '/budget-categories', component: BudgetCategoriesPage },
        { path: '/transactions/csv', component: DataImportPage },
        { path: '/loan-calculator', component: LoanCalculator },
        { path: '/account', component: AccountSettingsPage },
        { path: '/observability', component: ObservabilityRoute },
      ],
    },
  ],
})

export default function App() {
  return <Router>{(props) => <AppLayout>{props.children}</AppLayout>}</Router>
}
