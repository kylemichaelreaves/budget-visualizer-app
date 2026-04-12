# CLAUDE.md — budget-visualizer-app

## Pre-commit checklist

Always run these before committing or creating a PR:

```bash
bun run lint           # eslint
bun run format:check   # prettier (or `bun run format` to fix)
npx tsc -b             # TypeScript type checking (build mode — matches CI)
```

## Git hooks (optional, no extra npm deps)

Tracked hooks live in **`.githooks/`**. Point Git at them once per clone:

```bash
git config core.hooksPath .githooks
```

- **`pre-push`** runs `bun run prepush` (`lint` + `format:check`).
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
- For loading states during mutations, only show skeleton on initial load (`!query.data?.pages?.length`), not on background refetches — this preserves scroll position

## Utilities

- **Currency formatting**: use `formatUsd`, `formatUsdOrDash`, or `formatUsdAbs` from `@utils/formatUsd` — do not create local `Intl.NumberFormat` instances
- **Budget category path delimiter**: use `BUDGET_CATEGORY_PATH_DELIMITER` from `@api/helpers/convertToTree` (not hardcoded `' - '`)

## Store

- `transactionsStore.ts` holds filter state: `selectedDay`, `selectedWeek`, `selectedMonth`, `selectedYear`, `selectedMemo`, `selectedMemoId`
- Filter URL sync lives in `composables/transactionTableFilterUrlSync.ts` (used from `TransactionsTableSelects.tsx`) — all filters persist as query params
- URL helper functions (param validation, legacy migration) are in `composables/transactionFilterUrlHelpers.ts`
- `viewMode` determines which filter is active; `null` means no filter

## Charts

- `createLineChart` accepts `options.stackedDateLabels` — only used for historical chart
- `LineChart.tsx` is a SolidJS wrapper that passes props through
- Budget category colors: `buildBudgetCategoryColorMap` in `composables/budgetCategoryColors.ts` keys by `category_id`, `category_name`, `budget_category`, and `full_path`

## Playwright tests

- POMs are in `tests/e2e/pages/`
- Fixtures in `tests/e2e/fixtures/fixtures.ts` — add new POMs to both `test` and `authenticatedTest`
- Use `data-testid` attributes for locators
