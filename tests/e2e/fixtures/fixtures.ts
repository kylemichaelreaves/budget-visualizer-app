import { test as base } from '@playwright/test'
import { E2E_AUTH_TOKEN, E2E_AUTH_USER } from './auth-storage'
import { installApiMocks } from './install-api-mocks'
import { LoginPage } from '../pages/LoginPage'
import { SidebarNav } from '../pages/SidebarNav'
import { TransactionsPage } from '../pages/TransactionsPage'
import { TransactionCreateDialog } from '../pages/TransactionCreateDialog'
import { TransactionEditPage } from '../pages/TransactionEditPage'
import { PendingTransactionsPage } from '../pages/PendingTransactionsPage'
import { MemosPage } from '../pages/MemosPage'
import { MemoEditPage } from '../pages/MemoEditPage'
import { MemoSummaryPage } from '../pages/MemoSummaryPage'
import { BudgetCategoriesPage } from '../pages/BudgetCategoriesPage'
import { LoanCalculatorPage } from '../pages/LoanCalculatorPage'
import { NavBar } from '../pages/NavBar'
import { SplitBudgetCategoryDrawer } from '../pages/SplitBudgetCategoryDrawer'
import { CategoryTreeSelectDialog } from '../pages/CategoryTreeSelectDialog'

type Fixtures = {
  loginPage: LoginPage
  navbar: NavBar
  sidebar: SidebarNav
  transactionsPage: TransactionsPage
  transactionCreateDialog: TransactionCreateDialog
  transactionEditPage: TransactionEditPage
  pendingTransactionsPage: PendingTransactionsPage
  memosPage: MemosPage
  memoEditPage: MemoEditPage
  memoSummaryPage: MemoSummaryPage
  budgetCategoriesPage: BudgetCategoriesPage
  loanCalculatorPage: LoanCalculatorPage
  splitBudgetCategoryDrawer: SplitBudgetCategoryDrawer
  categoryTreeSelectDialog: CategoryTreeSelectDialog
}

/**
 * Unauthenticated fixture — no token injected, no API mocks.
 * Use for login-flow tests.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  navbar: async ({ page }, use) => {
    await use(new NavBar(page))
  },
  sidebar: async ({ page }, use) => {
    await use(new SidebarNav(page))
  },
  transactionsPage: async ({ page }, use) => {
    await use(new TransactionsPage(page))
  },
  transactionCreateDialog: async ({ page }, use) => {
    await use(new TransactionCreateDialog(page))
  },
  transactionEditPage: async ({ page }, use) => {
    await use(new TransactionEditPage(page))
  },
  pendingTransactionsPage: async ({ page }, use) => {
    await use(new PendingTransactionsPage(page))
  },
  memosPage: async ({ page }, use) => {
    await use(new MemosPage(page))
  },
  memoEditPage: async ({ page }, use) => {
    await use(new MemoEditPage(page))
  },
  memoSummaryPage: async ({ page }, use) => {
    await use(new MemoSummaryPage(page))
  },
  budgetCategoriesPage: async ({ page }, use) => {
    await use(new BudgetCategoriesPage(page))
  },
  loanCalculatorPage: async ({ page }, use) => {
    await use(new LoanCalculatorPage(page))
  },
  splitBudgetCategoryDrawer: async ({ page }, use) => {
    await use(new SplitBudgetCategoryDrawer(page))
  },
  categoryTreeSelectDialog: async ({ page }, use) => {
    await use(new CategoryTreeSelectDialog(page))
  },
})

/**
 * Authenticated fixture — injects auth into localStorage and installs
 * API mocks before each test. Use for all pages behind login.
 */
export const authenticatedTest = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({ user, token }: { user: string; token: string }) => {
        localStorage.setItem('user', user)
        localStorage.setItem('token', token)
      },
      { user: E2E_AUTH_USER, token: E2E_AUTH_TOKEN },
    )
    await installApiMocks(page)
    await use(page)
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  navbar: async ({ page }, use) => {
    await use(new NavBar(page))
  },
  sidebar: async ({ page }, use) => {
    await use(new SidebarNav(page))
  },
  transactionsPage: async ({ page }, use) => {
    await use(new TransactionsPage(page))
  },
  transactionCreateDialog: async ({ page }, use) => {
    await use(new TransactionCreateDialog(page))
  },
  transactionEditPage: async ({ page }, use) => {
    await use(new TransactionEditPage(page))
  },
  pendingTransactionsPage: async ({ page }, use) => {
    await use(new PendingTransactionsPage(page))
  },
  memosPage: async ({ page }, use) => {
    await use(new MemosPage(page))
  },
  memoEditPage: async ({ page }, use) => {
    await use(new MemoEditPage(page))
  },
  memoSummaryPage: async ({ page }, use) => {
    await use(new MemoSummaryPage(page))
  },
  budgetCategoriesPage: async ({ page }, use) => {
    await use(new BudgetCategoriesPage(page))
  },
  loanCalculatorPage: async ({ page }, use) => {
    await use(new LoanCalculatorPage(page))
  },
  splitBudgetCategoryDrawer: async ({ page }, use) => {
    await use(new SplitBudgetCategoryDrawer(page))
  },
  categoryTreeSelectDialog: async ({ page }, use) => {
    await use(new CategoryTreeSelectDialog(page))
  },
})

export { expect } from '@playwright/test'
