/**
 * Request-body contracts for the E2E API mocks, mirrored from resourceQuerier.
 *
 * The real handlers do not reject unknown fields; they silently drop them. A
 * snake_case `budget_category` on a transaction PATCH is not an error there, it
 * is a write that never happens. So these validators are deliberately a little
 * stricter than the backend in one respect: a snake_case key is reported, since
 * reaching the API at all means the client mapped a field wrong.
 *
 * Each validator returns `null` for a valid body or the error message the mock
 * should answer with. When resourceQuerier changes a contract, change it here.
 */

/** resourceQuerier `transactionsTableColumnsMapping`, minus server-owned columns. */
const TRANSACTION_WRITABLE_FIELDS = new Set([
  'transactionNumber',
  'date',
  'description',
  'memo',
  'memoId',
  'amountDebit',
  'amountCredit',
  'balance',
  'checkNumber',
  'fees',
  'budgetCategory',
])

/** resourceQuerier `memoTableColumnsMapping`, minus server-owned columns. */
const MEMO_WRITABLE_FIELDS = new Set([
  'name',
  'recurring',
  'necessary',
  'frequency',
  'budgetCategory',
  'ambiguous',
])

/** resourceQuerier `CSV_FILENAME_PATTERN` — case-sensitive, unlike the client's pre-check. */
const CSV_FILENAME_PATTERN = /^\d{4}_(0[1-9]|1[0-2])\.csv$/

/** resourceQuerier `createCsvImport` `ALLOWED_CONTENT_TYPES`. */
const CSV_CONTENT_TYPES = new Set(['text/csv', 'application/vnd.ms-excel'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function snakeCaseKeys(body: Record<string, unknown>): string[] {
  return Object.keys(body).filter((key) => key.includes('_'))
}

function rejectSnakeCase(body: Record<string, unknown>): string | null {
  const snake = snakeCaseKeys(body)
  return snake.length
    ? `snake_case field(s) ${snake.join(', ')} are ignored by the API; send camelCase`
    : null
}

function hasWritableField(body: Record<string, unknown>, writable: ReadonlySet<string>): boolean {
  return Object.entries(body).some(([key, value]) => writable.has(key) && value !== undefined)
}

/** PATCH /transactions/:id — `updateTransaction` reads the id from the body, not the path. */
export function validateTransactionPatch(body: unknown, pathId: number): string | null {
  if (!isPlainObject(body)) return 'Body must be a JSON object'
  if (body.id === undefined || Number.isNaN(Number(body.id))) return 'Missing or invalid id field'
  if (Number(body.id) !== pathId) return `Body id ${String(body.id)} does not match path id ${pathId}`
  const snake = rejectSnakeCase(body)
  if (snake) return snake
  if (!hasWritableField(body, TRANSACTION_WRITABLE_FIELDS)) return 'No fields to update were provided'
  return null
}

/** POST /transactions — `createTransaction` reads camelCase only. */
export function validateTransactionCreate(body: unknown): string | null {
  if (!isPlainObject(body)) return 'Body must be a JSON object'
  const snake = rejectSnakeCase(body)
  if (snake) return snake
  if (!body.memo || body.amountDebit == null || !body.date) {
    return 'Missing required fields: memo, amountDebit, and date are required'
  }
  return null
}

/** PATCH /memos/:id — `assembleMemoUpdateQuery`, including its recurring/frequency pairing. */
export function validateMemoPatch(body: unknown): string | null {
  if (!isPlainObject(body)) return 'Body must be a JSON object'
  const snake = rejectSnakeCase(body)
  if (snake) return snake

  const { recurring, frequency } = body
  const hasRecurring = recurring !== undefined
  const hasFrequency = frequency !== undefined
  if (hasRecurring !== hasFrequency) return '`recurring` and `frequency` must be updated together'
  if (hasRecurring) {
    if (recurring !== true && recurring !== false) return '`recurring` must be true or false'
    if (recurring && frequency === null) return 'A recurring memo requires a `frequency`'
    if (!recurring && frequency !== null) return 'A non-recurring memo cannot have a `frequency`'
  }

  if (!hasWritableField(body, MEMO_WRITABLE_FIELDS)) return 'No fields to update were provided'
  return null
}

/** PATCH /transactions/pending/:id — `validatePendingTransactionRequest`: a top-level string only. */
export function validatePendingTransactionPatch(body: unknown): string | null {
  const budgetCategory = isPlainObject(body) ? body.budgetCategory : undefined
  if (typeof budgetCategory !== 'string' || !budgetCategory.trim()) return 'budgetCategory is required'
  return null
}

/** POST /transactions/csv — `createCsvImport`. */
export function validateCsvImportCreate(body: unknown): string | null {
  if (!isPlainObject(body)) return 'Invalid JSON body'
  const { filename, contentType } = body
  if (typeof filename !== 'string' || filename.trim() !== filename || !CSV_FILENAME_PATTERN.test(filename)) {
    return 'filename must match the pattern YYYY_MM.csv (e.g. 2026_05.csv)'
  }
  if (typeof contentType !== 'string' || !CSV_CONTENT_TYPES.has(contentType)) {
    return `contentType must be one of: ${[...CSV_CONTENT_TYPES].join(', ')}`
  }
  return null
}
