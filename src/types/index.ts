export interface BudgetCategory {
  name: string
  necessary: boolean
  recurring: boolean
  frequency?: Frequency
}

/**
 * CategoryObject interface represents the base structure for budget category data.
 * Used in budget category summaries and pie chart visualizations.
 */
export interface CategoryObject {
  category_id: number
  category_name: string
  full_path: string
  level: number
  parent_id: number | null
  source_id: number
}

/**
 * BudgetCategorySummary extends CategoryObject with additional summary data.
 * Used for budget category analysis and chart data visualization.
 */
export interface BudgetCategorySummary extends CategoryObject {
  budget_category: string
  total_amount_debit: number
}

/**
 * CategoryNode interface represents a node in the category tree.
 * Each node has a value, a label, and optionally an array of child nodes.
 */
export interface CategoryNode {
  value: string // The value of the node
  label: string // The label of the node
  children?: CategoryNode[] // The child nodes of the node
}

/**
 * Categories interface represents the nested structure of budget categories.
 * Each category is a key-value pair where the value can contain subcategories.
 */
export interface Categories {
  [key: string]: Categories
}

export interface DailyInterval {
  day_number?: number
  week_number?: number
  month_number?: number
  year?: number
  date: Date
  total_amount_debit: number
  total_debit?: number
}

export interface DayYear {
  day: string
}

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type JsonObjectType = {
  total_debit: number
  month_number: string
  year: string
}

export interface LineChartDataPoint {
  date: Date
  total_debit: number
}

export type LoanFormType = {
  loanAmount: number
  interestRate: number
  loanTerm: number
  startDate: Date
  [key: string]: number | Date
}

export interface Memo {
  id: number
  name: string
  recurring: boolean
  necessary: boolean
  frequency?: Frequency
  budget_category?: string | null
  ambiguous: boolean
  total_amount_debit?: number
  transactions_count?: number
  avatar_s3_url?: string
}

/**
 * PATCH `/memos/:id` body (camelCase). `updateMemo` requires `id` and `name`; other fields are optional updates.
 */
export type MemoUpdateInput = {
  id: number
  name: string
  budgetCategory?: string | null
  ambiguous?: boolean
  recurring?: boolean
  necessary?: boolean
  frequency?: Frequency | null
}

export type MemoPatchFields = Partial<Omit<MemoUpdateInput, 'id' | 'name'>>

export interface MemoSummary {
  sum_amount_debit: number
  transactions_count: number
  /** Optional aggregate from API; when set, UI can show memo-wide credit totals instead of paginated sums. */
  sum_amount_credit?: number
}

export type MemoFilters = Partial<Pick<Memo, 'id' | 'name' | 'recurring' | 'necessary'>>

export interface MemoQueryParams extends MemoFilters {
  date?: string
  timeFrame?: Timeframe
  limit?: number
  offset?: number
  count?: boolean
  search?: boolean
}

export interface MonthSummary {
  memo: string
  total_amount_debit: number
  budget_category: string | null
  category_id?: number
  transaction_count?: number
}

export interface MonthYear {
  month_year: string
}

export type SummaryTypeBase = {
  total_debit: number
  total_amount_debit?: number
  year: string
  day_number?: string
  week_number?: string
  month_number?: string
  json?: JsonObjectType
  date?: string
  period_start?: string
}

export const Timeframe = {
  Day: 'day',
  Month: 'month',
  Week: 'week',
  Year: 'year',
} as const

export type Timeframe = (typeof Timeframe)[keyof typeof Timeframe]

export type ViewMode = 'day' | 'week' | 'month' | 'year' | 'memo' | null

export type Transaction = {
  id?: number
  transaction_number?: string
  date: string
  description: string
  memo: string
  /** Set to `null` in the edit form when the memo text is not tied to a resolved memo id (clears stale associations on PATCH). */
  memo_id?: number | null
  amount_debit: string
  amount_credit: string
  balance?: string
  check_number?: string
  fees?: string
  /** `null` in a PATCH clears a single-category assignment (see `updateTransaction`). */
  budget_category?: string | SplitBudgetCategory[] | null
  is_split?: boolean
}

/** PATCH `/transactions/:id` — `id` required; other fields optional. */
export type TransactionPatch = Partial<Transaction> & { id: number }

export type PendingTransaction = {
  id: number
  created_at: string
  transaction_data: string | Transaction // JSONB field - can be a JSON string or parsed object
  reviewed_at?: string
  amount_debit: string
  transaction_date: string
  memo_name: string
  assigned_category?: string | SplitBudgetCategory[] | null
  status: PendingTransactionStatus
}

export type PendingTransactionStatus = 'pending' | 'reviewed'

export interface TransactionQueryParams {
  date?: string
  offset?: number
  limit?: number
  memoId?: Memo['id']
  memoName?: Memo['name']
  timeFrame?: Timeframe
  oldestDate?: boolean
  count?: boolean
  isSplit?: boolean
  budgetCategory?: BudgetCategory['name']
  summary?: boolean
  summaryType?: 'historical' | 'period'
  totalAmountDebit?: boolean
  budgetCategorySummary?: boolean
  budgetCategoryHierarchySum?: boolean
  status?: PendingTransactionStatus
}

/**
 * The identity of the signed-in user. Deliberately carries **no credential
 * fields**: this object is JSON-serialized into `localStorage` by
 * `persistSession`, so a `password` here would mean a password at rest in the
 * browser. Forms hold password input in local signals and pass it separately
 * (see `CreateUserInput`, `changePassword`).
 */
export interface User {
  id?: number
  username: string
  firstName: string
  lastName: string
  email: string
  role?: UserRole
}

export type UserRole = 'admin' | 'user' | 'guest'

/** Body.user for `POST /api/v1/users` — fields persisted by resourceQuerier today. */
export type CreateUserInput = Pick<User, 'username' | 'email'> & {
  password: string
}

export interface CreateUserSessionResponse {
  user: User
  token: string
}

export interface WeekSummary {
  memo: string
  weekly_amount_debit: number
  budget_category?: string
  category_id?: number
  transaction_count?: number
}

export interface WeekYear {
  week_year: string
}

export interface Year {
  year: string
}

export type BudgetCategoryState =
  | { mode: 'single'; categoryId: string | null }
  | { mode: 'split'; splits: SplitBudgetCategory[] }

export interface SplitBudgetCategory {
  id: string
  budget_category_id: string
  amount_debit: number
}
