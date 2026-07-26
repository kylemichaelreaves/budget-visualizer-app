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
bun run typecheck      # tsc -b — builds app, node, unit-test, and e2e projects
```

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

- **SolidJS** (NOT React) — use `createSignal`, `createMemo`, `createEffect`, `For`, `Show`, etc.
- **@tanstack/solid-query** for data fetching
- **@kobalte/core** for UI primitives (Dialog, etc.)
- **D3** for charts (`createLineChart.ts`, `BudgetCategoryPieChart.tsx`)
- **Tailwind CSS** via `@tailwindcss/vite`

## SolidJS gotchas

- Never call `setSignal()` inside `createMemo` — use `createEffect` for side effects
- `<select>` elements don't re-apply `value` when async `<option>` elements load — use a `createEffect` watching the options to re-set `ref.value`
- Props are reactive getters in SolidJS — `props.value` inside `createMemo` tracks automatically via JSX transform

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
  - `invalidateAfterMemoMutation(queryClient)` — memos + transactions
- **Do not** `await` invalidation inside hook-level `onSuccess` for `mutateTransaction` — TanStack Query v5 blocks `mutate()`-level callbacks, which prevents `history.back()` navigation. Call `invalidateAfterTransactionUpdate` at the call site instead.
- Don't use store-level caches that short-circuit `queryFn` — let TanStack manage caching

## Retry policy

Set in `@api/queryClient` defaults; don't override per-call without a stated reason.

- **Mutations never auto-retry** (`retry: false`). Every mutation here is a non-idempotent POST/PATCH, so a replay duplicates the write — a second transaction row, a second reset email, or a password change retried with a now-stale `currentPassword` that reports failure after succeeding. If a specific endpoint becomes genuinely idempotent, opt that one mutation back in and say why.
- **Queries retry only when a retry could work** — see `shouldRetryQuery`: transport failures (no response) and 5xx, capped at `MAX_QUERY_RETRIES`. Never 4xx, never cancellations, never errors thrown by our own `queryFn`.
- For loading states during mutations, only show skeleton on initial load (`!query.data?.pages?.length`), not on background refetches — this preserves scroll position

## Utilities

- **Currency formatting**: use `formatUsd`, `formatUsdOrDash`, or `formatUsdAbs` from `@utils/formatUsd` — do not create local `Intl.NumberFormat` instances
- **Budget category path delimiter**: use `BUDGET_CATEGORY_PATH_DELIMITER` from `@api/helpers/convertToTree` (not hardcoded `' - '`)

## Session and auth

- The session bearer token lives in `localStorage`, so treat anything that could execute script on this origin as able to steal it. Don't add inline `<script>`, and don't log a login/session response — `devConsole` is dev-only but a token in a console transcript is still a token.
- **`User` carries no credential fields.** It is JSON-serialized into `localStorage` by `persistSession`, so a `password` on it would mean a password at rest in the browser. Password input belongs in local form signals (see `CreateUserInput`, `changePassword`).
- A `User` may only enter `authState` through **`normalizeUserFromApi`**, in both directions: API responses are `unknown`, and stored JSON is attacker-controlled if anything else on the origin can write it. Never `JSON.parse(raw) as User`. `persistSession` returns `false` when the payload is unusable — handle it, don't ignore it.
- Route guards must be **reactive** (`createEffect` on `authState.isUserAuthenticated`), not `onMount`, and authenticated child routes should be wrapped in a `<Show>` on the same condition — otherwise they mount and fire their queries before the redirect lands, producing a burst of 401s that races the interceptor's own redirect.

## Content Security Policy

The production `index.html` gets a CSP injected by the `csp-meta-tags` plugin in `vite.config.ts` (build-only — the dev server needs its inline HMR preamble and websocket).

It deliberately sets **no `default-src`**: that would inherit into `connect-src` and cut off both the API Gateway origin (cross-origin in prod, same-origin in dev via the Vite proxy) and the per-upload presigned S3 host, whose bucket and region aren't knowable at build time. `script-src 'self'` is the directive doing the real work. If you add an inline script or a third-party script/style host, update `CSP_DIRECTIVES` or the app will break in prod but not in dev.

`frame-ancestors` and HSTS can't be set via meta tag — those belong on the CloudFront response headers, which is also where a `Content-Security-Policy-Report-Only` rollout of a stricter `default-src`/`connect-src` policy should happen.

## Store

- `transactionsStore.ts` holds filter state: `selectedDay`, `selectedWeek`, `selectedMonth`, `selectedYear`, `selectedMemo`, `selectedMemoId`
- Filter URL sync lives in `composables/transactionTableFilterUrlSync.ts` (used from `components/transactions/table/TransactionsTableSelects.tsx`) — all filters persist as query params
- URL helper functions (param validation, legacy migration) are in `composables/transactionFilterUrlHelpers.ts`
- `viewMode` determines which filter is active; `null` means no filter

## Charts

- `createLineChart` accepts `options.stackedDateLabels` — only used for historical chart
- `LineChart.tsx` is a SolidJS wrapper that passes props through
- Budget category colors: `buildBudgetCategoryColorMap` in `composables/budgetCategoryColors.ts` keys by `category_id`, `category_name`, `budget_category`, and `full_path`

## Unit tests run in a non-UTC timezone

The `test` scripts pin **`TZ=Europe/Berlin`** (UTC+1/+2). This is load-bearing, not cosmetic: in a UTC process, code that builds dates with the local-time `new Date(y, m, d)` constructor behaves identically to correct `Date.UTC(...)` code, so a whole class of off-by-one-day bug is invisible. CI containers default to UTC, which is exactly how the `createLineChart` fallback bug reached production.

- Don't drop `TZ` from those scripts — `tests/unit/summaryPointDate.test.ts` has a precondition test that fails loudly if the suite ends up in UTC.
- Setting `process.env.TZ` inside a test, or via vitest's `env` option, **does not work** — Node caches the zone at startup. It has to be set before the process starts.
- When formatting or parsing dates for charts, remember the scales are `d3.scaleUtc()` and the click handlers emit `d3.utcFormat(…)`. Build dates with `Date.UTC(...)` or luxon's `{ zone: 'utc' }`.

## Period filter value formats

Month (`MM-YYYY`) and ISO week (`IW-YYYY`) filter values are the **same wire shape** and are indistinguishable for leading values 01–12 — `05-2026` is a valid month _and_ a valid ISO week, and `parseDateMMYYYY` / `parseDateIWIYYY` will each accept it and return dates ~4 months apart. The caller must already know which it holds (from `selectedMonth` vs `selectedWeek`, or the `month=` vs `week=` param). Don't add format "detection", and don't route one of these strings through a channel that has lost the distinction. See `periodValueFormat.ts`.

## Playwright tests

- POMs are in `tests/e2e/pages/`
- Fixtures in `tests/e2e/fixtures/fixtures.ts` — add new POMs to both `test` and `authenticatedTest`
- Use `data-testid` attributes for locators
