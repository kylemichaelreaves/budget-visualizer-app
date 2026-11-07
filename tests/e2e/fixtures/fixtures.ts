import { test as base, expect } from '@playwright/test'
import type {
  Fixtures as PlaywrightFixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'
import { E2E_AUTH_TOKEN, E2E_AUTH_USER } from './auth-storage'
import { installApiMocks, type ApiMocks } from './install-api-mocks'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { AccountSettingsPage } from '../pages/AccountSettingsPage'
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
import { DataImportPage } from '../pages/DataImportPage'
import { NavBar } from '../pages/NavBar'
import { SplitBudgetCategoryDrawer } from '../pages/SplitBudgetCategoryDrawer'
import { CategoryTreeSelectDialog } from '../pages/CategoryTreeSelectDialog'
import { MonthSummaryTablePage } from '../pages/MonthSummaryTablePage'
import { WeekSummaryTablePage } from '../pages/WeekSummaryTablePage'
import { ObservabilityPage } from '../pages/ObservabilityPage'

type Fixtures = {
  loginPage: LoginPage
  registerPage: RegisterPage
  forgotPasswordPage: ForgotPasswordPage
  resetPasswordPage: ResetPasswordPage
  accountSettingsPage: AccountSettingsPage
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
  dataImportPage: DataImportPage
  splitBudgetCategoryDrawer: SplitBudgetCategoryDrawer
  categoryTreeSelectDialog: CategoryTreeSelectDialog
  monthSummaryTablePage: MonthSummaryTablePage
  weekSummaryTablePage: WeekSummaryTablePage
  observabilityPage: ObservabilityPage
}

/**
 * Page Object Model instances shared by unauthenticated `test` and `authenticatedTest`.
 *
 * Annotated explicitly: hoisting this map out of the `base.extend<Fixtures>({ … })`
 * call site strips its contextual type, so without this every `{ page }` and `use`
 * below would silently infer as `any`.
 */
const pageObjectFixtures: PlaywrightFixtures<
  Fixtures,
  NonNullable<unknown>,
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = {
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page))
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page))
  },
  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page))
  },
  accountSettingsPage: async ({ page }, use) => {
    await use(new AccountSettingsPage(page))
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
  dataImportPage: async ({ page }, use) => {
    await use(new DataImportPage(page))
  },
  splitBudgetCategoryDrawer: async ({ page }, use) => {
    await use(new SplitBudgetCategoryDrawer(page))
  },
  categoryTreeSelectDialog: async ({ page }, use) => {
    await use(new CategoryTreeSelectDialog(page))
  },
  monthSummaryTablePage: async ({ page }, use) => {
    await use(new MonthSummaryTablePage(page))
  },
  weekSummaryTablePage: async ({ page }, use) => {
    await use(new WeekSummaryTablePage(page))
  },
  observabilityPage: async ({ page }, use) => {
    await use(new ObservabilityPage(page))
  },
}

/**
 * Unauthenticated fixture — no token injected, no API mocks.
 * Use for login-flow tests.
 */
export const test = base.extend<Fixtures>({
  ...pageObjectFixtures,
})

/**
 * Authenticated fixture — injects auth into localStorage and installs
 * API mocks before each test. Use for all pages behind login.
 *
 * A test fails if any request it made broke a resourceQuerier body contract,
 * even when the spec never looks at that response: the real API would have
 * rejected or silently dropped the write.
 */
export const authenticatedTest = base.extend<Fixtures & { authUser: string; apiMocks: ApiMocks }>({
  /** Serialized `User` written to localStorage; override with `test.use({ authUser: E2E_ADMIN_USER })`. */
  authUser: [E2E_AUTH_USER, { option: true }],
  // Installed on the context, not the page, so `page` can depend on this; a spec's
  // own `page.route` still takes precedence over these handlers.
  apiMocks: async ({ context, authUser }, use) => {
    await context.addInitScript(
      ({ user, token }: { user: string; token: string }) => {
        localStorage.setItem('user', user)
        localStorage.setItem('token', token)
      },
      { user: authUser, token: E2E_AUTH_TOKEN },
    )
    const mocks = await installApiMocks(context)
    await use(mocks)
    expect(mocks.contractViolations, 'requests that break a resourceQuerier contract').toEqual([])
  },
  // Depends on apiMocks so every authenticated test gets auth and mocks, used or not.
  page: async ({ page, apiMocks }, use) => {
    void apiMocks
    await use(page)
  },
  ...pageObjectFixtures,
})

export { expect } from '@playwright/test'
