# CLAUDE.md — budget-visualizer-app

## Pre-commit checklist

Always run these before committing or creating a PR:

```bash
bun run lint           # eslint
bun run format:check   # prettier (or `bun run format` to fix)
npx tsc --noEmit       # TypeScript type checking
```

## Git hooks (optional, no extra npm deps)

Tracked hooks live in **`.githooks/`**. Point Git at them once per clone:

```bash
git config core.hooksPath .githooks
```

- **`pre-push`** runs `bun run prepush` (`lint` + `format:check`).
- **`pre-commit`** runs `bun test`.

**Before every `git push`:** run `bun run prepush` (or rely on the hook). If it fails, run `bun run format` and fix lint, then push again. Agents should do the same even when using `--no-verify`.

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

## Query invalidation

- After mutations, use `queryClient.invalidateQueries({ queryKey: [...] })`
- Memo updates should invalidate both `['memos']` and `['transactions']` (category propagation)
- Don't use store-level caches that short-circuit `queryFn` — let TanStack manage caching
- For loading states during mutations, only show skeleton on initial load (`!query.data?.pages?.length`), not on background refetches — this preserves scroll position

## Store

- `transactionsStore.ts` holds filter state: `selectedDay`, `selectedWeek`, `selectedMonth`, `selectedYear`, `selectedMemo`, `selectedMemoId`
- Filter URL sync lives in `composables/transactionTableFilterUrlSync.ts` (used from `TransactionsTableSelects.tsx`) — all filters persist as query params
- `viewMode` determines which filter is active; `null` means no filter

## Charts

- `createLineChart` accepts `options.stackedDateLabels` — only used for historical chart
- `LineChart.tsx` is a SolidJS wrapper that passes props through
- Budget category colors: `buildBudgetCategoryColorMap` in `composables/budgetCategoryColors.ts` keys by `category_id`, `category_name`, `budget_category`, and `full_path`

## Playwright tests

- POMs are in `tests/e2e/pages/`
- Fixtures in `tests/e2e/fixtures/fixtures.ts` — add new POMs to both `test` and `authenticatedTest`
- Use `data-testid` attributes for locators
