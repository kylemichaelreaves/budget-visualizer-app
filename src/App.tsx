import { Navigate, Route, Router } from '@solidjs/router'
import CreateUserPage from '@components/auth/CreateUserPage'
import ForgotPasswordPage from '@components/auth/ForgotPasswordPage'
import Login from '@components/auth/Login'
import ResetPasswordPage from '@components/auth/ResetPasswordPage'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'
import NavBar from '@components/layout/NavBar'
import LoanCalculator from '@components/loan/LoanCalculator'
import MemoEditPage from '@components/memos/forms/MemoEditPage'
import MemoSummaryPage from '@components/memos/summaries/MemoSummaryPage'
import MemosTable from '@components/memos/table/MemosTable'
import BudgetCategoriesPage from '@components/budgetCategories/BudgetCategoriesPage'
import GenealogyPage from '@genealogy/GenealogyPage'
import AccountSettingsPage from '@components/settings/AccountSettingsPage'
import PendingTransactionsTable from '@components/transactions/pending/PendingTransactionsTable'
import TransactionEditPage from '@components/transactions/forms/TransactionEditPage'
import TransactionsTable from '@components/transactions/table/TransactionsTable'
import TransactionsWithTimeframeSummaryRoute from '@components/transactions/summaries/TransactionsWithTimeframeSummaryRoute'
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
      <Route path="/register" component={CreateUserPage} />
      <Route path="/password/reset" component={ForgotPasswordPage} />
      <Route path="/password/confirm" component={ResetPasswordPage} />
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
        <Route path="/budget-categories" component={BudgetCategoriesPage} />
        <Route path="/loan-calculator" component={LoanCalculator} />
        <Route path="/genealogy" component={GenealogyPage} />
        <Route path="/account" component={AccountSettingsPage} />
      </Route>
    </Router>
  )
}
