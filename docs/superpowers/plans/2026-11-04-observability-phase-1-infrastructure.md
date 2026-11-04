# Observability Phase 1 — Infrastructure Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An admin-only Observability page in the SPA whose Infrastructure tab shows live CloudWatch health for API Gateway, the four Lambdas, the ingestion dead-letter queue and RDS.

**Architecture:** The user's role becomes a JWT claim issued at login and passed on by the token authorizer in its context. A new `MetricsFunction` Lambda, outside the VPC and behind the existing API Gateway, checks that claim and reads CloudWatch `GetMetricData`. The SPA adds an Admin sidebar section, a guarded route, and the Infrastructure tab built from existing UI primitives and theme tokens.

**Tech Stack:** resourceQuerier: TypeScript Lambdas (nodejs24.x, arm64, esbuild), SAM, Jest, `@aws-sdk/client-cloudwatch`. SPA: SolidJS, `@tanstack/solid-query`, `@solidjs/router`, D3 scales, Tailwind tokens, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-observability-design.md`. Mockups: https://claude.ai/artifact/VpVLy6v2pbhHqokXQoc1pi (the Infrastructure artboard, light and dark).

**Repos and PR order:** Tasks 1–5 are in `~/src/resourceQuerier` and ship as one PR there. It deploys on merge, and Task 6 (granting the admin role) is a manual step by the owner after that deploy. Tasks 7–12 are in `~/src/budget-visualizer-app` and ship as one PR. That PR can be built and tested in parallel against e2e mocks, but should merge after the resourceQuerier deploy so the real page works.

## Global Constraints

- The role claim is the only admin gate. Every observability endpoint returns **403** unless `requestContext.authorizer.role === 'admin'`. A token without a role claim counts as `'user'`.
- `MetricsFunction` has **no `VpcConfig`** and **never touches Postgres**. Its IAM grant is `cloudwatch:GetMetricData` only (Resource `*`, since GetMetricData doesn't support resource-level permissions).
- Route: `GET /api/v1/observability/metrics?range=<1h|24h|7d|30d>` on `ResourceQuerierApi`, behind the default `TokenAuthorizer`. The SPA calls it as `/observability/metrics`; `httpClient` already prefixes `/api/v1`.
- The CSP is unchanged: the new route is on the existing API origin.
- Ranges and buckets: `1h` → 60 s buckets, `24h` → 3600 s, `7d` → 21600 s, `30d` → 86400 s. The default range is `24h`.
- Missing CloudWatch data is `null` end to end, and the UI shows it as `—`. Never coerce it to `0`.
- Token lifetime stays `'24h'`. A role change applies at the next sign-in.
- SPA conventions (CLAUDE.md): query keys only in `@api/queryKeys.ts`; one component per file; pure helpers in `helpers/`; reactive guards (`createEffect`/`<Show>`, not `onMount`); `data-testid` locators; new POMs go in both `test` and `authenticatedTest`; colors only from `theme.css` tokens so dark mode works; `formatBytes` from `@utils/formatBytes`.
- resourceQuerier conventions (its CLAUDE.md): `bun run lint` and `bun run test:unit` before committing; never `sam deploy` locally; deploys happen on merge to `main`.
- SPA checks before each push: `bun run prepush`, `npx tsc -b`, `bun run test`.

## Review Focus

1. **No datapoints for a metric in the range** (e.g. UserManager not invoked in the last hour, or an RDS metric gap): the summary value is `null` and renders as `—`, never `0`, `NaN` or `undefined ms`. Tests are in Task 4 (`shapeMetricsResponse` nulls) and Task 8 (formatters).
2. **A token issued before this deploy**, with no `role` claim: the authorizer passes `role: 'user'` and the endpoint returns 403. A stored SPA session without a `role` shows no Admin link. Tests are in Task 2 and Task 10.
3. **Someone sets `role: 'admin'` in `localStorage` by hand**: the SPA shows the page, the API returns 403, and the page shows a "You don't have access" state rather than crashing or rendering empty cards. The test is in Task 10.
4. **A bad or missing `range`** (`?range=banana`, or none): the backend returns 400 for a bad value and defaults to `24h` when the param is absent. The SPA's `parseObservabilityRange` falls back to `24h` and the URL keeps working. Tests are in Task 3 and Task 7.
5. **CloudWatch fails** (AccessDenied, throttling, a timeout): the endpoint returns 502 `{ message: 'Metrics unavailable' }` with no AWS error text in the body. The SPA shows an error state with a Retry button. Tests are in Task 5 and Task 9.

---

## resourceQuerier (`~/src/resourceQuerier`, run from `src/handlers` unless noted)

### Task 1: Role claim in the session token and login response

**Files:**
- Modify: `src/handlers/shared/helpers/jwtHelpers.ts` (`TokenPayload`, `DecodedToken`)
- Modify: `src/handlers/userManager/user/buildAuthSessionPayload.ts`
- Modify: `src/handlers/userManager/user/loginUser.ts` (the SELECT)
- Modify: `src/handlers/userManager/user/createUser.ts` (passes through `authSessionUserFromDbRow`; a new user is always `'user'`)
- Test: `src/handlers/userManager/tests/user/buildAuthSessionPayload.test.ts`, `src/handlers/userManager/tests/user/loginUser.test.ts`

**Interfaces:**
- Produces: `export type SessionRole = 'admin' | 'user' | 'guest'` in `jwtHelpers.ts`. `TokenPayload` and `DecodedToken` gain `role?: SessionRole`. `AuthSessionUserRow` gains `role: SessionRole`. `authSessionUserFromDbRow(row: { id: unknown; email: string; username: string; role?: unknown }): AuthSessionUserRow` normalizes an unknown, missing or null role to `'user'`. `buildAuthSessionPayload` signs `{ sub, email, role }` and returns `user: { id, email, username, role }`.

- [ ] **Step 1: Write failing tests**
  - `buildAuthSessionPayload.test.ts`: `it('signs the role claim and returns it on user')`: decode the returned token with `jsonwebtoken.decode`, expect `role === 'admin'` for an admin row, and `user.role === 'admin'`.
  - Same file: `it('normalizes an unknown or null role to user')`: `authSessionUserFromDbRow({ id: 1, email: 'a@b.c', username: 'a', role: 'superuser' }).role === 'user'`, and the same for `null` and `undefined`.
  - `loginUser.test.ts`: `it('selects the role name from roles')`: assert the query text passed to the mocked pool contains `LEFT JOIN roles` and that a row with `role: 'admin'` produces `user.role === 'admin'` in the 200 body.
- [ ] **Step 2: Run them and confirm they fail.** Run: `bun run unit:userManager -- --testPathPatterns buildAuthSessionPayload|loginUser`. Expected: FAIL (no `role` on the result).
- [ ] **Step 3: Implement.** Change the login query to `SELECT u.id, u.email, u.password, u.username, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE LOWER(u.email) = $1` and pass `role: user.role` into `authSessionUserFromDbRow`. Keep the decoy-hash path unchanged.
- [ ] **Step 4: Run `bun run unit:userManager` and confirm it passes.** Expected: PASS, with the existing createUser and login tests still green.
- [ ] **Step 5: Commit.** `git commit -m "feat(auth): carry the user's role in the session token and login response"`

### Task 2: Authorizer context and `requireAdmin`

**Files:**
- Modify: `src/handlers/shared/helpers/generatePolicy.ts`
- Modify: `src/handlers/authorizer/app.ts`
- Create: `src/handlers/shared/helpers/requireAdmin.ts`
- Modify: `src/handlers/package.json`: add `"unit:authorizer": "jest --config authorizer/jest.config.ts"` and `"unit:metrics": "jest --config metrics/jest.config.ts"`, and make `unit` run `unit:resourceQuerier && unit:userManager && unit:authorizer && unit:metrics`. The authorizer tests exist today but no script runs them.
- Test: `src/handlers/authorizer/tests/app.test.ts`, `src/handlers/metrics/tests/requireAdmin.test.ts` (with `metrics/jest.config.ts` copied from `authorizer/jest.config.ts`)

**Interfaces:**
- Consumes: `DecodedToken.role` (Task 1).
- Produces: `generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string, context?: Record<string, string>): APIGatewayAuthorizerResult`, which sets `context` only when given. The authorizer returns `context: { role: decoded.role ?? 'user' }`. `requireAdmin(event: APIGatewayProxyEvent): APIGatewayProxyResult | null` returns `createErrorResponse(403, 'Forbidden')` unless `event.requestContext?.authorizer?.role === 'admin'`, and `null` when allowed.

- [ ] **Step 1: Write failing tests**
  - `authorizer/tests/app.test.ts`: `it('passes the role claim in context')` (a token signed with `role: 'admin'` gives `result.context?.role === 'admin'`) and `it('defaults a token without a role claim to user')` (gives `'user'`).
  - `metrics/tests/requireAdmin.test.ts`: `it('allows admin')` → `null`; `it('rejects user, missing authorizer, and missing role with 403')`, with all three cases giving `statusCode === 403` and body `{ message: 'Forbidden' }`.
- [ ] **Step 2: Run them and confirm they fail.** Run: `bun run unit:authorizer && bun run unit:metrics`. Expected: FAIL.
- [ ] **Step 3: Implement** both changes and the helper.
- [ ] **Step 4: Run `bun run unit` and confirm it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(auth): pass role in authorizer context; add requireAdmin"`

### Task 3: Metric query builder

**Files:**
- Create: `src/handlers/metrics/rangeConfig.ts`
- Create: `src/handlers/metrics/buildMetricQueries.ts`
- Create: `src/handlers/metrics/types.ts` (the response contract, copied verbatim into the SPA in Task 7)
- Test: `src/handlers/metrics/tests/rangeConfig.test.ts`, `src/handlers/metrics/tests/buildMetricQueries.test.ts`
- Modify: `src/handlers/package.json`: add the dependency `@aws-sdk/client-cloudwatch` (same major as the other `@aws-sdk/*`).

**Interfaces:**
- Produces, in `types.ts`:
  ```ts
  export type ObservabilityRange = '1h' | '24h' | '7d' | '30d'
  export type LambdaKey = 'resourceQuerier' | 'userManager' | 'authorizer' | 'ingestion'
  export interface MetricPoint { t: string; value: number | null }
  export interface LambdaMetrics {
    key: LambdaKey; functionName: string; stack: 'resourceQuerier' | 'transactions-bucket-to-db'
    invocations: number | null; errors: number | null; throttles: number | null; p95DurationMs: number | null
  }
  export interface ObservabilityMetrics {
    range: ObservabilityRange; generatedAt: string; bucketSeconds: number
    api: { requests: number | null; errors4xx: number | null; errors5xx: number | null
           p50LatencyMs: number | null; p95LatencyMs: number | null; p95LatencySeries: MetricPoint[] }
    lambdas: LambdaMetrics[]
    ingestion: { dlqVisible: number | null }
    rds: { cpuPercent: number | null; connections: number | null; freeStorageBytes: number | null; readLatencyMs: number | null }
  }
  export interface MetricsTargets {
    apiName: string; apiStage: string; rdsInstanceId: string; ingestDlqName: string
    functions: Record<LambdaKey, string>
  }
  ```
- Produces: `parseRange(raw: string | undefined): ObservabilityRange | null` (`undefined` → `'24h'`, an unknown value → `null`); `RANGE_CONFIG: Record<ObservabilityRange, { rangeSeconds: number; bucketSeconds: number }>`; `buildMetricQueries(targets: MetricsTargets, range: ObservabilityRange): MetricDataQuery[]`.
- Query plan: API Gateway `Count`, `4XXError`, `5XXError` (Sum, bucket period, dimensions `ApiName`, `Stage`); `Latency` p95 as a series (bucket period), plus p50 and p95 as summaries with **period = rangeSeconds** (percentiles can't be summed across buckets). Per Lambda (`FunctionName`): `Invocations`, `Errors`, `Throttles` (Sum, bucket period) and `Duration` p95 summary (period = rangeSeconds). SQS `ApproximateNumberOfMessagesVisible` (Maximum, bucket period, `QueueName`). RDS (`DBInstanceIdentifier`): `CPUUtilization` (Average), `DatabaseConnections` (Maximum), `FreeStorageSpace` (Minimum), `ReadLatency` (Average, in seconds), all at bucket period. Query ids are `snake_case` and unique, e.g. `api_count`, `api_p95_series`, `api_p95_sum`, `fn_resourceQuerier_errors`, `dlq_visible`, `rds_cpu`. Name them with a stable scheme Task 4 can parse back (`fn_<LambdaKey>_<metric>`).

- [ ] **Step 1: Write failing tests**
  - `rangeConfig.test.ts`: `parseRange(undefined) === '24h'`, `parseRange('7d') === '7d'`, `parseRange('banana') === null`, `parseRange('') === null`; `RANGE_CONFIG['1h']` is `{ rangeSeconds: 3600, bucketSeconds: 60 }` and `RANGE_CONFIG['30d']` is `{ rangeSeconds: 2592000, bucketSeconds: 86400 }`.
  - `buildMetricQueries.test.ts`: `it('uses the bucket period for series and the range period for percentile summaries')`; `it('emits one Errors query per lambda with its FunctionName dimension')`; `it('has unique ids')`; `it('stays within the GetMetricData 500-query limit')`.
- [ ] **Step 2: Run `bun run unit:metrics` and confirm it fails.**
- [ ] **Step 3: Implement** `rangeConfig.ts` and `buildMetricQueries.ts`.
- [ ] **Step 4: Run `bun run unit:metrics` and confirm it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(metrics): CloudWatch query plan per range"`

### Task 4: Fetch and shape the results

**Files:**
- Create: `src/handlers/metrics/fetchMetricResults.ts`
- Create: `src/handlers/metrics/shapeMetricsResponse.ts`
- Test: `src/handlers/metrics/tests/fetchMetricResults.test.ts`, `src/handlers/metrics/tests/shapeMetricsResponse.test.ts`

**Interfaces:**
- Consumes: `MetricDataQuery[]` and the id scheme (Task 3), types (Task 3).
- Produces: `fetchMetricResults(client: CloudWatchClient, queries: MetricDataQuery[], start: Date, end: Date): Promise<Map<string, { timestamps: Date[]; values: number[] }>>`, which follows `NextToken` until it is exhausted and merges pages per id. `shapeMetricsResponse(results, targets: MetricsTargets, range: ObservabilityRange, now: Date): ObservabilityMetrics`. Sum metrics: summed across buckets, `null` when there are no datapoints. Percentile summaries: the single datapoint or `null`. DLQ and RDS: the latest datapoint or `null`. `readLatencyMs = seconds × 1000`. `p95LatencySeries` has one point per bucket from `start` to `end`, oldest first, ISO timestamps, with `null` for empty buckets. The `lambdas` order is resourceQuerier, authorizer, userManager, ingestion, with `stack` set accordingly.

- [ ] **Step 1: Write failing tests**
  - `fetchMetricResults.test.ts`: mock `client.send` to return two pages (the first with `NextToken`); expect a second call with that token, and both pages' values merged under the same id.
  - `shapeMetricsResponse.test.ts`: `it('sums Sum metrics across buckets')`; `it('returns null, not 0, when a metric has no datapoints')`; `it('takes the latest DLQ and RDS datapoint')`; `it('converts ReadLatency seconds to ms')`; `it('fills empty latency buckets with null')` (24 h range → 24 points); `it('orders lambdas and sets stack')`.
- [ ] **Step 2: Run them and confirm they fail.** Run: `bun run unit:metrics`.
- [ ] **Step 3: Implement** both.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(metrics): fetch with pagination and shape the response"`

### Task 5: Metrics handler and SAM function

**Files:**
- Create: `src/handlers/metrics/app.ts`
- Create: `src/handlers/metrics/tsconfig.json` (copy `authorizer/tsconfig.json`) and add it to `type-check` in `package.json`
- Modify: `template.yaml`: add a `Parameters:` block and a `MetricsFunction`
- Test: `src/handlers/metrics/tests/app.test.ts`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `parseRange`, `RANGE_CONFIG`, `buildMetricQueries` (Task 3), `fetchMetricResults`, `shapeMetricsResponse` (Task 4), `createErrorResponse` and `createSuccessResponse` from `shared/helpers/responseHelpers`.
- Produces: `lambdaHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>`. It runs `requireAdmin` first (403), then `parseRange(event.queryStringParameters?.range)` (400 `{ message: 'Invalid range' }`), then fetches. Any CloudWatch error gives 502 `{ message: 'Metrics unavailable' }`; log the error **name** only. It reads `MetricsTargets` from env vars: `API_NAME`, `API_STAGE`, `RDS_INSTANCE_ID`, `INGEST_DLQ_NAME`, `FN_RESOURCE_QUERIER`, `FN_USER_MANAGER`, `FN_AUTHORIZER`, `FN_INGESTION`.

- [ ] **Step 1: Write failing tests** in `app.test.ts`, mocking `@aws-sdk/client-cloudwatch`:
  - `it('403s a non-admin before calling CloudWatch')`: expect `send` was not called.
  - `it('400s an invalid range')` (`range=banana`) and `it('defaults to 24h when range is absent')` (expect `range: '24h'` in the body).
  - `it('502s with a generic message when CloudWatch throws')`: `send` rejects with `Object.assign(new Error('User: arn:aws:sts::123:assumed-role/x is not authorized'), { name: 'AccessDeniedException' })`; expect status 502 and a body that is exactly `{ message: 'Metrics unavailable' }`, with no `arn:` anywhere in the body.
  - `it('returns the shaped metrics for an admin')`.
- [ ] **Step 2: Run `bun run unit:metrics` and confirm it fails.**
- [ ] **Step 3: Implement `app.ts`.**
- [ ] **Step 4: Add `MetricsFunction` to `template.yaml`**, next to `AuthorizerFunction` and shaped like it: `CodeUri: ./src/handlers/`, `Handler: metrics/app.lambdaHandler`, `Runtime: nodejs24.x`, `arm64`, `Tracing: Active`, esbuild `EntryPoints: [metrics/app.ts]`, **no `VpcConfig`**, and a policy statement allowing `cloudwatch:GetMetricData` on `*`. Its event: `Type: Api`, `RestApiId: !Ref ResourceQuerierApi`, `Path: /api/v1/observability/metrics`, `Method: get`. Env vars: `API_NAME: !Ref AWS::StackName` (the SAM API has no `Name`, so it takes the stack name; confirm in Step 6), `API_STAGE: Prod`, `FN_RESOURCE_QUERIER: !Ref ResourceQuerierFunction`, `FN_USER_MANAGER: !Ref UserManagerFunction`, `FN_AUTHORIZER: !Ref AuthorizerFunction`, and `RDS_INSTANCE_ID`, `INGEST_DLQ_NAME`, `FN_INGESTION` from new template `Parameters` with these defaults: `RdsInstanceId: database-1`, `IngestDlqName: transactions-bucket-to-db-ingest-dlq`, `IngestFunctionName` (default from Step 6).
- [ ] **Step 5: Run `bun run unit` (in `src/handlers`), `bun run lint` (repo root), and `AWS_PROFILE=personal sam validate --lint` (repo root) and confirm they pass.**
- [ ] **Step 6: Look up the real names (read-only).** Run `AWS_PROFILE=personal aws cloudformation describe-stack-resource --stack-name transactions-bucket-to-db --logical-resource-id TransactionsBucketToDBFunction --query StackResourceDetail.PhysicalResourceId --output text` and use the result as the `IngestFunctionName` default. Run `AWS_PROFILE=personal aws apigateway get-rest-apis --query "items[].name"` to confirm the API names are `resourceQuerier` and `resourceQuerier-dev`; if they differ, set `API_NAME` to match. Run `AWS_PROFILE=personal aws rds describe-db-instances --query "DBInstances[].DBInstanceIdentifier"` to confirm `database-1`.
- [ ] **Step 7: Run `PATH="$PWD/node_modules/.bin:$PATH" AWS_PROFILE=personal sam build` (build only, never deploy) and confirm it passes.**
- [ ] **Step 8: Commit, push, and open the resourceQuerier PR.** `git commit -m "feat(metrics): admin-only CloudWatch metrics endpoint outside the VPC"`. Merging deploys it.

### Task 6: Grant the admin role (owner, manual, after deploy)

**Files:**
- Create: `docs/admin-role.md` in resourceQuerier, committed with Task 5's PR, holding the SQL below and the note that `roles` is Rails-owned, so this edits data, never schema.

- [ ] **Step 1: Owner opens the tunnel** (`bun run db:tunnel`) and checks the roles: `SELECT id, name FROM roles;`
- [ ] **Step 2: If no `admin` row exists, add one:** `INSERT INTO roles (name, description) VALUES ('admin', 'Observability and admin pages');`
- [ ] **Step 3: Grant it:** `UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE LOWER(email) = LOWER('<owner email>');` Expect `UPDATE 1`.
- [ ] **Step 4: Sign out and back in to the SPA,** then check that the stored user in `localStorage` has `"role":"admin"`.

## budget-visualizer-app (`~/src/budget-visualizer-app`)

### Task 7: Types, range helper, fetcher, query key and hook

**Files:**
- Create: `src/types/observability.ts` (the Task 3 contract, verbatim, minus `MetricsTargets`), re-exported from `src/types/index.ts`
- Create: `src/components/observability/helpers/observabilityRange.ts`
- Create: `src/api/observability/fetchObservabilityMetrics.ts`
- Create: `src/api/hooks/observability/useObservabilityMetrics.ts`
- Modify: `src/api/queryKeys.ts`
- Test: `tests/unit/observabilityRange.test.ts`, `tests/unit/fetchObservabilityMetrics.test.ts`

**Interfaces:**
- Produces: `OBSERVABILITY_RANGES: readonly ObservabilityRange[] = ['1h', '24h', '7d', '30d']` and `parseObservabilityRange(raw: string | undefined): ObservabilityRange` (anything unknown → `'24h'`); `fetchObservabilityMetrics(range: ObservabilityRange): Promise<ObservabilityMetrics>` calling `httpClient.get('/observability/metrics', { params: { range } })`; `queryKeys.observability = { all: ['observability'] as const, metrics: (range: ObservabilityRange) => ['observability', 'metrics', range] as const }`; `useObservabilityMetrics(range: () => ObservabilityRange)` built with `useQuery`, `staleTime: 60_000`, and `meta: { skipGlobalError: true }` (the page renders its own error state).

- [ ] **Step 1: Write failing tests:** `parseObservabilityRange('7d') === '7d'`, `('banana')`, `('')` and `(undefined)` all `=== '24h'`; the fetcher calls `httpClient.get` with `'/observability/metrics'` and `{ params: { range: '1h' } }` (mock `@api/httpClient` the way `fetchRecurringSeries.test.ts` does).
- [ ] **Step 2: Run `bun run test -- observabilityRange fetchObservabilityMetrics` and confirm it fails.**
- [ ] **Step 3: Implement** all five files.
- [ ] **Step 4: Run them again and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(observability): metrics types, range helper and query"`

### Task 8: Formatters and health rules

**Files:**
- Create: `src/components/observability/helpers/formatMetric.ts`
- Create: `src/components/observability/helpers/healthStatus.ts`
- Test: `tests/unit/observabilityFormatMetric.test.ts`, `tests/unit/observabilityHealthStatus.test.ts`

**Interfaces:**
- Produces: `formatCount(n: number | null): string` (`2184` → `'2,184'`, `null` → `'—'`); `formatMs(ms: number | null): string` (`412` → `'412 ms'`, `1380` → `'1.4 s'`, `null` → `'—'`); `formatPercent(p: number | null): string` (`14.2` → `'14%'`, `null` → `'—'`); `formatRate(numerator: number | null, denominator: number | null): string` (`18 / 2184` → `'0.8%'`, a null or zero denominator → `'—'`). Storage uses the existing `formatBytes`. `type Health = 'healthy' | 'degraded' | 'failing' | 'unknown'`; `apiHealth(api): Health` is `unknown` when `requests` is null, `failing` when the 5xx rate is ≥ 5%, `degraded` when the 5xx rate is ≥ 1% or `p95LatencyMs` > 800, otherwise `healthy`; `lambdaHealth(l: LambdaMetrics): Health` is `unknown` when `invocations` is null, `failing` when `errors` / `invocations` ≥ 5%, `degraded` when `errors` > 0 or `throttles` > 0, otherwise `healthy`; `ingestionHealth(dlqVisible: number | null): Health` is `unknown` for null, `failing` when > 0, otherwise `healthy`. Badge labels: healthy → `Healthy`, degraded → `Errors`, failing → `Failing`, unknown → `No data`.

- [ ] **Step 1: Write failing tests** with exactly the example values above, including every `null` case and the thresholds at their boundaries (5xx rate of exactly 1% → `degraded`, p95 of exactly 800 → `healthy`).
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(observability): metric formatters and health rules"`

### Task 9: Infrastructure tab components

**Files (one component each, under `src/components/observability/infrastructure/` unless noted):**
- Create: `src/components/observability/HealthBadge.tsx` (`Badge`-styled; `healthy` uses success tokens, `degraded` uses caution tokens, `failing` uses negative tokens, `unknown` uses muted tokens)
- Create: `ApiGatewayCard.tsx` (stats row: Requests, 4xx, 5xx, p50 / p95 latency; plus `LatencyBars`)
- Create: `LatencyBars.tsx` (an SVG bar per `p95LatencySeries` point, heights from `d3.scaleLinear`, bars over 800 ms in the negative token and others in brand, `role="img"` with an `aria-label` stating the peak, null buckets drawn as no bar)
- Create: `LambdaTable.tsx` (the existing `ui/table`; columns Function, Stack, Invocations, Errors, p95 duration, Throttles, Status)
- Create: `IngestionCard.tsx` (DLQ depth with `ingestionHealth`, plus the ingestion Lambda's invocations and errors; the runs list is phase 2, so show none)
- Create: `RdsCard.tsx` (CPU with a `ui/progress` bar, connections, free storage, read latency)
- Create: `InfrastructureTab.tsx` (composes the above from `useObservabilityMetrics`; skeletons only on first load (`!query.data`); a 403 shows `You don't have access to observability.`; any other error shows `Metrics are unavailable right now.` and a Retry `Button` calling `query.refetch()`)
- Create: `src/components/observability/infrastructure/InfrastructureTab.stories.tsx` (full, all-null and error states, with mocked data like `RecurringPage.stories.tsx`). Storybook's `withThemeByClassName` toolbar is the only place the `.dark` class is applied today, since the app has no theme switch, so this is where the dark artboard is checked.
- Test: `tests/unit/ObservabilityInfrastructureTab.test.tsx`, `tests/unit/ObservabilityLatencyBars.test.tsx`

**Interfaces:**
- Consumes: Tasks 7–8. Each card takes the slice it renders as props (`api`, `lambdas`, `dlqVisible` plus the ingestion `LambdaMetrics`, `rds`). `InfrastructureTab` takes `range: () => ObservabilityRange`.
- `data-testid`s: `observability-api-card`, `observability-lambda-table`, `observability-ingestion-card`, `observability-rds-card`, `observability-error`, `observability-retry`, `observability-forbidden`.

- [ ] **Step 1: Write failing tests** (render with a `QueryClientProvider`, mocking `fetchObservabilityMetrics`):
  - `it('renders every card from a full response')`: `2,184` and `96 ms / 412 ms` are visible; the four Lambda names are rows.
  - `it('shows — for null metrics instead of 0')`: an all-null response gives no `0` and no `NaN` in the cards, and `—` is present.
  - `it('shows the forbidden state on 403')`, by rejecting with an axios error whose `response.status` is 403.
  - `it('shows an error with Retry on 502 and refetches on click')`.
  - `ObservabilityLatencyBars.test.tsx`: `it('draws one bar per non-null point and marks bars over 800 ms negative')`.
- [ ] **Step 2: Run `bun run test -- Observability` and confirm it fails.**
- [ ] **Step 3: Implement** the components with tokens only (`bg-card`, `border`, `text-muted-foreground`, `bg-success-muted text-success-on-muted`, `bg-caution-muted text-caution-on-muted`, `bg-negative-muted text-negative-emphasis`, `bg-brand`), matching the Infrastructure artboard.
- [ ] **Step 4: Run the tests and confirm they pass,** then run `bun run storybook` and compare each story in the light and dark toolbar themes against the Infrastructure artboards.
- [ ] **Step 5: Commit.** `git commit -m "feat(observability): infrastructure tab"`

### Task 10: Page, route, admin sidebar and guard

**Files:**
- Create: `src/components/observability/ObservabilityPage.tsx` (heading `Observability`, the description line, the range toggle, a tab bar with one tab (Infrastructure) that phase 2 extends, and `InfrastructureTab`)
- Create: `src/components/observability/RangeToggle.tsx` (the existing `ui/toggle-group`; options from `OBSERVABILITY_RANGES`)
- Create: `src/components/observability/ObservabilityRoute.tsx` (the guard)
- Modify: `src/App.tsx`: add `<Route path="/observability" component={ObservabilityRoute} />` under `/budget-visualizer`
- Modify: `src/components/layout/BudgetVisualizer.tsx`: add an `Admin` section with `{ path: '/budget-visualizer/observability', title: 'Observability' }`, rendered only when `authState.user.role === 'admin'`; add `/observability` to the paths that hide the "Add New Transaction" header
- Test: `tests/unit/BudgetVisualizerNav.test.tsx` (extend), `tests/unit/ObservabilityRoute.test.tsx`

**Interfaces:**
- The range lives in the `range` search param via `useSearchParams`, read through `parseObservabilityRange`. Changing it calls `setSearchParams({ range })` (it replaces history, like the table filters). The Refresh button calls `refetch()`. "Updated N min ago" comes from `query.dataUpdatedAt`.
- The guard is reactive: `<Show when={authState.user.role === 'admin'} fallback={<Navigate href="/budget-visualizer/transactions" />}>`. Don't use `onMount`.
- `data-testid`s: `observability-page`, `observability-range-<value>`, `observability-refresh`, and `sidebar-admin-observability` on the link.

- [ ] **Step 1: Write failing tests**
  - `BudgetVisualizerNav.test.tsx`: `it('shows the Admin section only to admins')` (with role `'user'` there's no `Observability` link; with `'admin'` the last link is `['Observability', '/budget-visualizer/observability']`) and `it('hides Admin for a stored user without a role')`.
  - `ObservabilityRoute.test.tsx`: `it('redirects a non-admin to transactions')`; `it('renders the page for an admin')`; `it('falls back to 24h for ?range=banana')` (the `24h` toggle item is pressed); `it('writes the chosen range to the URL')`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `bun run test` and confirm it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(observability): admin-only page and route"`

### Task 11: Dark-mode contrast on brand fills

**Files:**
- Modify: `src/styles/theme.css`: in `.dark`, set `--brand-foreground: oklch(0.145 0 0)`. White on `#5dade2` is about 2.3:1, which fails WCAG AA; this affects the active sidebar item and every `bg-brand` fill in dark mode.
- Test: `tests/unit/themeContrast.test.ts`

- [ ] **Step 1: Write a failing test.** Parse `theme.css`, read `.dark` `--brand` and `--brand-foreground`, compute the WCAG contrast ratio (convert `oklch` through a small helper in the test, or compare against a known hex for `oklch(0.145 0 0)` ≈ `#0a0a0a`), and assert it's ≥ 4.5.
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Change the token.**
- [ ] **Step 4: Run it and confirm it passes,** then check the brand buttons and the active sidebar item in Storybook's dark theme.
- [ ] **Step 5: Commit.** `git commit -m "fix(theme): readable text on brand fills in dark mode"`

### Task 12: End-to-end

**Files:**
- Create: `tests/e2e/pages/ObservabilityPage.ts` (POM), registered in both `test` and `authenticatedTest` in `tests/e2e/fixtures/fixtures.ts`
- Modify: `tests/e2e/fixtures/auth-storage.ts`: add `E2E_ADMIN_USER` (like `E2E_AUTH_USER` with `role: 'admin'`) and an `adminTest` fixture (or an option on `authenticatedTest`) that seeds it
- Modify: `tests/e2e/fixtures/install-api-mocks.ts`: stub `GET /api/v1/observability/metrics` with a full fixture response, returning 400 for a bad range
- Create: `tests/e2e/observability.spec.ts`

- [ ] **Step 1: Write the specs:** an admin sees the sidebar link, opens the page, sees all four cards, switches to `7d` and the URL has `range=7d`, then reloads and `7d` is still selected; a non-admin has no link and a direct visit lands on `/budget-visualizer/transactions`; a stubbed 403 shows `observability-forbidden`; with dark mode on (`page.evaluate(() => document.documentElement.classList.add('dark'))`, since the app has no theme switch and `.dark` on the root is what `theme.css` keys on), the page renders with `observability-api-card` visible and the body background equal to the `.dark` `--background` value.
- [ ] **Step 2: Run `bun run test:e2e -- observability` and confirm it fails.**
- [ ] **Step 3: Implement** the POM, fixtures and mocks.
- [ ] **Step 4: Run them and confirm they pass;** then run `bun run prepush`, `npx tsc -b` and `bun run test`, all green.
- [ ] **Step 5: Commit, push, and open the SPA PR.** `git commit -m "test(observability): e2e for the infrastructure tab"`

## After both PRs

- [ ] With the resourceQuerier deploy done and Task 6 complete, sign in as the owner and open `/budget-visualizer/observability?range=24h` against the real API. Check that the four Lambda rows show non-null invocations and that the API card matches the CloudWatch console's numbers for the same window.
