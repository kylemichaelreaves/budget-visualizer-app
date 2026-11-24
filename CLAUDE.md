# CLAUDE.md — budget-visualizer-app

## Pre-commit checklist

Always run these before committing or creating a PR:

```bash
bun run prepush        # lint + format:check + typecheck — mirrors the CI gates
```

Or individually:

```bash
bun run lint           # eslint (covers src, tests/unit, tests/e2e, and root configs)
bun run format:check   # prettier (or `bun run format` to fix)
bun run typecheck      # tsc -b — builds app, node, .storybook, unit-test, and e2e projects
```

## CI job names are load-bearing

`main` is protected: merging requires a PR whose **Lint & Format**, **Typecheck**, **Unit Tests**, and **E2E Tests** checks have all passed, and requires the branch to be up to date with `main` first. This is enforced for admins too.

Those four strings are registered as required status check _contexts_, matched against the `name:` of each job in `.github/workflows/ci.yml`. **Renaming a job — or removing one — silently blocks every PR forever**, because the required context stops reporting and GitHub waits for a check that will never arrive. If you rename or add a job, update the protection contexts in the same change:

```bash
gh api repos/kylemichaelreaves/budget-visualizer-app/branches/main/protection/required_status_checks \
  -X PATCH -f strict=true -f 'contexts[]=Lint & Format' -f 'contexts[]=Typecheck' \
  -f 'contexts[]=Unit Tests' -f 'contexts[]=E2E Tests'
```

Escape hatch if you ever lock yourself out (re-enable immediately after):

```bash
gh api -X DELETE repos/kylemichaelreaves/budget-visualizer-app/branches/main/protection/enforce_admins
gh api -X POST   repos/kylemichaelreaves/budget-visualizer-app/branches/main/protection/enforce_admins
```

**SonarQube** is deliberately **not** a required context. Fork and Dependabot PRs get no `SONAR_TOKEN`, so the job skips its scan there, and an outage at SonarCloud shouldn't block merges. Its quality gate is advisory. It also only works while SonarCloud's Automatic Analysis is **off** for the project, because the two modes are mutually exclusive.

Linear history is deliberately **not** required, so merge commits are allowed — stacked PRs depend on them.

## Git hooks (optional, no extra npm deps)

Tracked hooks live in **`.githooks/`**. Point Git at them once per clone:

```bash
git config core.hooksPath .githooks
```

- **`pre-push`** runs `bun run prepush` (`lint` + `format:check` + `typecheck`).
- **`pre-commit`** runs **`bun run test`** (Vitest unit tests; not `bun test`, which uses Bun’s built-in runner).

**Before every `git push`:** run `bun run prepush` (or rely on the hook). If it fails, run `bun run format` and fix lint, then push again. Agents should do the same even when using `--no-verify`.

## Copilot / PR review comments

When new Copilot (or similar) inline review comments appear on an open PR, **implement agreed fixes directly**—do not ask for permission to proceed unless the feedback is ambiguous or conflicts with product intent.

## Agent workflow after code changes

After implementing fixes on a branch with an open PR (or any pushed branch):

1. Run **`bun run prepush`**, **`npx tsc -b`**, and **`bun run test`**; fix anything that fails (including `bun run format` if Prettier complains).
2. **Commit** with a clear message.
3. **`git push`** to the remote branch—**do not ask** whether to push once checks pass.

Use **`git commit --no-verify`** only when a hook is misbehaving in the agent environment after you’ve run the same checks manually and they pass. Do not push if TypeScript, tests, or `prepush` still fail.

## Tech stack

- **SolidJS 2** (NOT React, and NOT Solid 1) — `solid-js` for reactivity and control flow, `@solidjs/web` for `render`, `Portal`, `Dynamic` and the `JSX` types. `jsxImportSource` is `@solidjs/web`. The bundled primer is `node_modules/solid-js/skills/solid-2.0/SKILL.md`; read it before writing Solid code here.
- **@solidjs/router 2** — routes are a config object passed to `createRouter` in `App.tsx`; there is no `<Router>`/`<Route>` JSX, no `<A>` and no `<Navigate>`. Links are plain `<a href>` (the router intercepts them). Redirect on render with `@components/shared/Redirect`. Unit tests and stories that need router context wrap the component in `MemoryRouterShell` (`@mocks/MemoryRouterShell`).
- **@tanstack/solid-query 6 (prerelease)** for data fetching — see "Reading queries" below
- **@kobalte/core 2 (alpha)** for UI primitives (Dialog, etc.), wrapped in `components/ui/`. Its dialogs don't register as dismissable layers under Solid 2, so `ui/dialog.tsx` closes on Escape and overlay click itself (`useDialogDismissFallback`); drop that once Kobalte fixes it.
- **@lucide/solid** for icons. Icon `class` is a plain string, so build conditional classes with `cn()`.
- **D3** for charts (`charts/createLineChart.ts`, and `BudgetCategorySunburst.tsx` / `mountBudgetCategorySunburst.ts` and `BudgetCategoryTreemap.tsx` under `components/transactions/charts/`)
- **Tailwind CSS** via `@tailwindcss/vite`

## TypeScript strictness

`noUncheckedIndexedAccess` is on: `arr[i]`, `match[1]`, `split(...)[0]` and record lookups are `T | undefined`. In `src/`, handle the miss instead of asserting it away. Destructure and guard (`const [first] = xs; if (!first) …`), use `.at(-1)`, or reach for the helpers: `lastTwo` (`@utils/lastTwo`) for "previous vs latest" steps and `isoDatePart` (`@utils/isoDatePart`) for the date half of an ISO timestamp. Tests may use `!`, since `no-non-null-assertion` is off there and a wrong index still fails the test.

Path aliases live in `tsconfig.paths.json` with `./`-relative targets and no `baseUrl` (deprecated in TS 6, removed in 7). `aliases.node.ts` derives the Vite/Vitest/Storybook aliases from the same file.

## SolidJS gotchas

- **`createEffect(compute, apply)` always takes two functions.** Reactive reads go in `compute`, side effects in `apply` (which runs untracked). Effects don't compare: `apply` re-runs whenever `compute` does, so put a memo in `compute` to skip equal values. `apply` must return a cleanup function or nothing. Give it a block body: a concise arrow that returns a setter's value (`(v) => setX(v)`) is an invalid cleanup, and the error halts every reactive update on the page.
- **No writes in owned scopes.** Writing a signal or store inside a memo, an effect's `compute`, a render effect, or a component body throws in dev (`REACTIVE_WRITE_IN_OWNED_SCOPE`). Write from event handlers, an effect's `apply`, or `onSettled`. For form state seeded from props once per entity, use a derived store, `createStore(() => { key(); return untrack(seed) }, initial)` (see `useMemoEditForm`), or a writable derived signal, `createSignal(() => …)` (see `TransactionMemoFilterField`).
- **Reads lag writes.** After `setX(1)`, `x()` still returns the old value until the microtask flush. Code that writes then reads in the same handler sees the old value. Tests call `flush()` from `solid-js` before asserting; `fireEvent` already flushes, via the `eventWrapper` in `tests/setup/vitest-setup.ts`.
- **Stores take draft setters only:** `setStore((s) => { s.field = v })`. The path form (`setStore('field', v)`) and the object-merge form are gone; `Object.assign(s, {...})` inside the draft replaces the merge.
- **Renames:** `splitProps` → `omit`, `mergeProps` → `merge`, `onMount` → `onSettled`, `<Suspense>` → `<Loading>`, `<ErrorBoundary>` → `<Errored>`, `unwrap` → `snapshot`, `<Ctx.Provider value>` → `<Ctx value>`. `batch` and `on()` are gone (writes batch per microtask; put the source in the effect's `compute`).
- **`class` replaces `classList`:** `class={['base', { active: isActive() }]}` on native elements.
- **Attributes are attributes.** `data-x={false}` removes the attribute instead of writing `"false"`, so use `String(flag)` where CSS or a selector matches `"true"`/`"false"`. Enumerated `aria-*` values take strings (`aria-pressed={on ? 'true' : 'false'}`), and attribute names are lowercase (`novalidate`, `tabindex`).
- `<select>` elements don't re-apply `value` when async `<option>` elements load — use a `createEffect` whose `compute` reads the options and the value, and whose `apply` re-sets `ref.value`
- Props are reactive getters — read `props.value` in JSX, a memo or an effect's `compute`, never destructure it. A read at the top of a component body doesn't update (dev warns `STRICT_READ_UNTRACKED`)

## Component file conventions (single-file components)

Convention, not a lint gate — there is no clean Solid-native rule to enforce it (`react/no-multi-comp` is React-only and misfires on render-prop children and local fragments), so hold it in review instead.

- **One component per file.** A reusable/named component gets its own file named after it (e.g., `forms/TransactionCreateForm.tsx`, `table/TransactionsTable.tsx`). The page component is composition + state only.
- **Co-locate only trivial, single-use fragments** (a one-off `Row`/`Section`/`StepBtn` used by exactly one parent) inside that parent's file. The moment a fragment is reused or grows, promote it to its own file.
- **Pure helpers live in their own `helpers/`/`utils/` files**, one concern per file, not mixed into data or component files.
- See `src/components/transactions/` for the reference layout (`table/`, `forms/`, `charts/`, `summaries/`, `helpers/`).

## API conventions

- `httpClient` from `@api/httpClient` has base URL `/api/v1` (Vite proxy in dev, API Gateway in prod)
- Don't prefix paths with `/api/v1` — the base URL already includes it
- Backend expects **camelCase** field names (e.g., `budgetCategory`, `amountDebit`)
- Transaction updates: send via request body (`httpClient.patch(url, body)`), map snake_case frontend fields to camelCase for the API
- Memo updates: `PATCH /memos/{id}` with JSON body

## Query keys and invalidation

- All query keys live in `@api/queryKeys.ts` — import `queryKeys` / `mutationKeys` instead of writing string literals
  - Use `.all` for prefix invalidation (e.g., `queryKeys.transactions.all`)
  - Use builder functions for specific queries (e.g., `queryKeys.transactions.infinite(limit, memoKey, tf, date)`)
- Centralized invalidation helpers in `@api/queryInvalidation.ts`:
  - `invalidateAfterTransactionCreate(queryClient)` — broad (transactions + memos + budget summaries)
  - `invalidateAfterTransactionUpdate(queryClient, { transactionId })` — same scope + single transaction
  - `invalidateAfterPendingTransactionApprove(queryClient, { pendingTransactionId })` — create scope + that pending row
  - `invalidateAfterMemoMutation(queryClient)` — create scope + memo, every transaction detail, recurring. The backend cascades a memo's category into its transactions.
  - `invalidateAfterBudgetCategoryMutation(queryClient)` — memo scope + category list. Use it for rename, move and delete, which cascade into memos and transactions. An add only needs `budgetCategories.all`.
- **`mutate()` returns a promise and takes no per-call callbacks** (solid-query 6; `mutateAsync` is gone). Put call-site settle logic after it: `void m.mutate(vars).then(onDone, (err) => …)`. Always pass a rejection handler, even `() => {}`: a bare `.then(onDone)` turns a failed mutation into an unhandled rejection. Inside an `async` handler, `await m.mutate(vars)` in a `try`.
- **Do not** `await` or return invalidation from a hook-level `onSuccess` — the promise `mutate()` returns waits for it, which blocks closing a dialog or navigating (`history.back()`, `navigate`). Either `void` it inside the hook (`mutateCreateTransaction`, `mutateMemo`, `mutatePendingTransaction`) or call the helper at the call site without awaiting (`mutateTransaction`).
  - The opt-in exception is a caller with no dialog or navigation that shows the saved value straight from the query: `mutateMemo({ awaitInvalidation: true })` (memos table, memo summary page) and `mutateBudgetCategory` (categories tree, which closes its editor once `mutate()` resolves). There the pending state should cover the refetch, or the control flashes the old value.
- **Writes go through a `useMutation` hook** with a `mutationKeys` entry, never a raw `httpClient` call plus hand-rolled saving/error signals. Read `isPending` / `error` / `variables` off the mutation; when several writes can be in flight at once (one per tree node), read them with `useMutationState` filtered by the mutation key, since `variables` only holds the latest call.
- Don't use store-level caches that short-circuit `queryFn` — let TanStack manage caching

## Reading queries (solid-query 6)

- **Read `data` through `settledData(q)`** (`@api/helpers/settledData`), never `q.data`. In v6 `data` is an async read: pending, it suspends into the nearest `<Loading>`; disabled with nothing cached, it suspends forever; errored with no data, it throws to `<Errored>`. This app renders those states inline, so `settledData` returns `undefined` for them. It reads through `latest()`, so a refetch doesn't hold the store write that triggered it in a transition (that's what left the transactions filters impossible to clear).
- **Read fetch-state flags through `queryFlag(q, 'isLoading')`** (`@api/helpers/queryFlag`), and the same for `isFetching`, `isRefetching`, `isFetchingNextPage` and `isFetchingPreviousPage`. On a disabled query those flags probe `data` and suspend forever; `queryFlag` answers `false` from `isEnabled` first. `isPending`, `isError`, `isSuccess`, `status`, `fetchStatus` and `hasNextPage` are plain reads.

## Retry policy

Set in `@api/queryClient` defaults; don't override per-call without a stated reason.

- **Mutations never auto-retry** (`retry: false`). Every mutation here is a non-idempotent POST/PATCH, so a replay duplicates the write — a second transaction row, a second reset email, or a password change retried with a now-stale `currentPassword` that reports failure after succeeding. If a specific endpoint becomes genuinely idempotent, opt that one mutation back in and say why.
- **Queries retry only when a retry could work** — see `shouldRetryQuery`: transport failures (no response) and 5xx, capped at `MAX_QUERY_RETRIES`. Never 4xx, never cancellations, never errors thrown by our own `queryFn`.
- For loading states during mutations, only show skeleton on initial load (`!settledData(query)?.pages?.length`), not on background refetches — this preserves scroll position

## Utilities

- **API errors**: render a failed query or mutation with `ApiErrorAlert` (`error={q.isError && q.error}`, a `title` naming what failed). For a string, use `extractApiErrorMessage`. Never use `(err as Error).name` / `.message`: a 4xx then reads "HttpError" / "Request failed with status code 409" and drops the server's `message`.
- **Promises**: `no-floating-promises` (src + tests) and `no-misused-promises` (src) are on. Mark intentional fire-and-forget with `void`, including `onClick={() => void q.refetch()}`. Inside a `.then` callback after `mutate()`, chain further promises with `void p.finally(...)` rather than making the callback `async`.
- **Currency formatting**: use `formatUsd`, `formatUsdOrDash`, or `formatUsdAbs` from `@utils/formatUsd` — do not create local `Intl.NumberFormat` instances
- **Budget category path delimiter**: use `BUDGET_CATEGORY_PATH_DELIMITER` from `@api/helpers/convertToTree` (not hardcoded `' - '`)

## Session and auth

- The session bearer token lives in `localStorage`, so treat anything that could execute script on this origin as able to steal it. Don't add inline `<script>`, and don't log a login/session response — `devConsole` is dev-only but a token in a console transcript is still a token.
- **`User` carries no credential fields.** It is JSON-serialized into `localStorage` by `persistSession`, so a `password` on it would mean a password at rest in the browser. Password input belongs in local form signals (see `CreateUserInput`, `changePassword`).
- A `User` may only enter `authState` through **`normalizeUserFromApi`**, in both directions: API responses are `unknown`, and stored JSON is attacker-controlled if anything else on the origin can write it. Never `JSON.parse(raw) as User`. `persistSession` returns `false` when the payload is unusable — handle it, don't ignore it.
- Route guards must be **reactive** (a `createEffect` whose `compute` reads `authState.isUserAuthenticated`), not a one-shot `onSettled`, and authenticated child routes should be wrapped in a `<Show>` on the same condition — otherwise they mount and fire their queries before the redirect lands, producing a burst of 401s that races the interceptor's own redirect.

## Content Security Policy

The production `index.html` gets a CSP injected by the `csp-meta-tags` plugin in `vite.config.ts` (build-only — the dev server needs its inline HMR preamble and websocket).

`script-src 'self'` and `connect-src` do the real work: the bearer token is in `localStorage`, so restricting both where script comes from and where the page may send data is what stops an injected script from stealing it.

**`connect-src` has exactly two destinations**, and both are load-bearing:

- The **API origin**, derived from `VITE_APIGATEWAY_URL` via `loadEnv` — the same variable `src/constants.ts` builds the client `baseURL` from, so the policy cannot drift from the URL the app calls. Use `loadEnv`, never plain `process.env`: `process.env` does not see `.env` files, while the client does via `import.meta.env`, so the allowlist would silently omit the real host. When the variable is unset the client uses a relative `/api/v1`, covered by `'self'`.
- The **presigned CSV upload host** (`CSV_UPLOAD_ORIGINS`). resourceQuerier signs a `PutObjectCommand` against the bucket in SSM `/dev/resourceQuerier/s3/transactionsBucket` — currently `transactions-bucket` in `us-east-1`. **If that bucket or region changes, update `CSV_UPLOAD_ORIGINS` or CSV import breaks in production only.** Path-style S3 URLs are deliberately excluded; they would allowlist every bucket on the endpoint.

Adding any new network destination, inline script, or third-party host means updating `cspDirectives()` — otherwise it works in dev (no CSP there) and fails in prod.

Still **no `default-src`**: it would inherit into directives this app hasn't been audited against — `style-src` in particular, since d3 sets inline styles.

`frame-ancestors` and HSTS can't be set via meta tag — those belong on the CloudFront response headers, which is also where a `Content-Security-Policy-Report-Only` rollout of a stricter `default-src` policy should happen.

## Store

- `transactionsStore.ts` holds filter state: `selectedDay`, `selectedWeek`, `selectedMonth`, `selectedYear`, `selectedMemo`, `selectedMemoId`
- Filter URL sync lives in `composables/transactionTableFilterUrlSync.ts` (used from `components/transactions/table/TransactionsTableSelects.tsx`) — all filters persist as query params
- URL helper functions (param validation, legacy migration) are in `composables/transactionFilterUrlHelpers.ts`
- `viewMode` determines which filter is active; `null` means no filter
- Read the active period through **`activePeriodFromStore()`** (`composables/activePeriodFromStore.ts`), never by checking `selectedDay`/`selectedWeek`/… in your own order — the table query, the charts and the URL must resolve the same timeframe. `urlHasTimeframe(sp)` is the URL-side check.
- Parse entity ids (route params, query params, hook `enabled` gates) with **`parsePositiveIntId`** from `@utils/parsePositiveIntId`. `Number(x) > 0` accepts `"1e3"` and `"1.5"`.

## Charts

- `createLineChart` accepts `options.stackedDateLabels` — only used for historical chart
- `LineChart.tsx` is a SolidJS wrapper that passes props through
- Budget category colors: `buildBudgetCategoryColorMap` in `composables/budgetCategoryColors.ts` keys by `category_id`, `category_name`, `budget_category`, and `full_path`

## Unit tests run in a non-UTC timezone

The `test` scripts pin **`TZ=America/New_York`**, matching where the project is developed. This is load-bearing, not cosmetic: in a UTC process, code that resolves dates in the local zone behaves identically to correct UTC code, so a whole class of off-by-one-day bug is invisible. CI containers default to UTC.

- Don't drop `TZ` from those scripts — `tests/unit/summaryPointDate.test.ts` has a precondition test that fails loudly if the suite ends up in UTC.
- Setting `process.env.TZ` inside a test, or via vitest's `env` option, **does not work** — Node caches the zone at startup. It has to be set before the process starts.
- **Assert the resolved instant, not the formatted day.** `expect(d.toISOString()).toBe('2026-03-01T00:00:00.000Z')` is strictly stronger than `expect(fmt(d)).toBe('2026-03-01')`: an instant of exactly UTC midnight is the correct calendar day in every zone. Day-only assertions have no teeth west of UTC, where local-midnight construction still yields the right date — which is why any non-zero offset suffices and the pin can match your own machine.
- When formatting or parsing dates for charts, remember the scales are `d3.scaleUtc()` and the click handlers emit `d3.utcFormat(…)`. Build dates with `Date.UTC(...)` or luxon's `{ zone: 'utc' }`.

## Period filter value formats

Month (`MM-YYYY`) and ISO week (`IW-YYYY`) filter values are the **same wire shape** and are indistinguishable for leading values 01–12 — `05-2026` is a valid month _and_ a valid ISO week, and `parseDateMMYYYY` / `parseDateIWIYYY` will each accept it and return dates ~4 months apart. The caller must already know which it holds (from `selectedMonth` vs `selectedWeek`, or the `month=` vs `week=` param). Don't add format "detection", and don't route one of these strings through a channel that has lost the distinction. See `periodValueFormat.ts`.

## Summary rows always carry a string date

Both endpoints behind `LineChart` select a date column, so a summary row has either `period_start` (historical summaries, `date_trunc`) or `date` (daily totals, `DATE(date)`). There are no `year` / `day_number` / `week_number` / `month_number` fields — those names appear nowhere in resourceQuerier, and the client-side fallback that once reconstructed a date from them was unreachable. Don't reintroduce it: `summaryPointDate` returns `null` for an unusable row and `createLineChart` drops the point, which is preferable to plotting a guessed position.

## Playwright tests

- POMs are in `tests/e2e/pages/`
- Fixtures in `tests/e2e/fixtures/fixtures.ts` — add new POMs to both `test` and `authenticatedTest`
- Use `data-testid` attributes for locators
