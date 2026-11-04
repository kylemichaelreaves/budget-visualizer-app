# Observability page — design

Date: 2026-11-04 · Status: draft for review
Mockups: [Observability Page Mockups](https://claude.ai/artifact/VpVLy6v2pbhHqokXQoc1pi) (Overview, Infrastructure, Error detail; light and dark rows). The mockups are approved for layout and content; their numbers are sample data.

## Why

When something breaks today, the only way to find out what happened is to go hunting in the AWS console: CloudWatch log groups for two stacks, X-Ray, and the ingestion dead-letter queue. Browser-side errors are not captured anywhere in production — every error path in the SPA ends in `devConsole`, which is a no-op outside dev.

The goal is one admin-only page inside the app that answers "is anything broken, and what exactly happened?" with enough detail (stack trace, the failing request, what led up to it) that opening AWS is the exception, and that lands you on the right trace or log when you do.

## Goals

- **Error tracking, Sentry-style**, for three sources: the SPA (browser), resourceQuerier (API Lambdas), and transactions-bucket-to-db (CSV ingestion). Errors are grouped, counted, and viewable in detail.
- **Infrastructure health**: API Gateway, the four Lambdas, CSV ingestion runs / dead-letter queue, and RDS — over a selectable range (1 h / 24 h / 7 d / 30 d).
- **Details in-app**: source-mapped stack trace, a short trail of what happened before the error, browser/route context, and the API request that caused it, with deep links to its X-Ray trace and CloudWatch logs.
- **Light and dark mode**, using the existing `theme.css` tokens. The app itself has no theme switch today; `.dark` is only applied in Storybook. So the page supports dark mode whenever that class is set, and a user-facing switch is separate work.

## Non-goals

- Replacing CloudWatch for deep debugging or long-term log archival.
- Alerting / paging. The existing SNS email alarm on the ingestion DLQ stays as it is; the page is for looking.
- Product analytics (Amplitude-style usage tracking).
- A hosted third-party tool (Sentry, Grafana Cloud). Everything stays in the personal AWS account.

## Anti-goals (would make this a failure even if it works)

- **Leaking the session token or financial data.** Captured errors and breadcrumbs must never include the bearer token, `localStorage` contents, request or response bodies, or transaction/memo text. Query strings are recorded only with values stripped or allowlisted (see Privacy).
- **Loosening the CSP.** `connect-src` stays exactly as it is: errors go to our own API, not a third-party host.
- **Non-admins seeing the page or its data**, in the UI *or* via the API.
- **Error reporting that causes errors**: capture must never throw, must not retry-storm (mutations never auto-retry here), and must not block the UI.

## Constraints

- SolidJS + `@tanstack/solid-query` + D3 + Tailwind in this repo; follow CLAUDE.md conventions (query keys in `@api/queryKeys.ts`, one component per file, `formatUsd` etc.).
- Production CSP (`cspDirectives()` in `vite.config.ts`): `connect-src` is the API origin plus the CSV upload host. No inline scripts.
- resourceQuerier: routes are registered in `src/handlers/resourceQuerier/resources/routeHandlers.ts` under `/api/v1/...`; deploys happen on merge to `main` via its pipeline (never `sam deploy` locally); schema changes go in `db/migrations/` and `db/schema.sql` with a `pending` entry in `db/prod-snapshot.json`.
- Auth: the token authorizer (`src/handlers/authorizer/app.ts`) only verifies the JWT and passes `sub` (user id) as `principalId`. **There is no role check anywhere in the backend today.** `users.role_id → roles.name` exists in the database, and the SPA's `User` type has `role?: 'admin' | 'user' | 'guest'`.
- The ingestion Lambda (Python 3.13) already has a 90-day log group, a DLQ, and a DLQ-not-empty alarm via SNS.
- X-Ray tracing is already active on API Gateway and all resourceQuerier Lambdas. Lambda timeout is 30 s.
- `ResourceQuerierFunction` runs in a VPC with **no NAT gateway**; the only VPC endpoints (kylereaves.infrastructure `modules/vpc_endpoints`) are S3, SSM and Secrets Manager. A CloudWatch API call from inside that VPC will hang until timeout. The Authorizer Lambda already runs outside the VPC. Session JWTs (`jwtHelpers.generateToken`) are HS256 and expire after 24 h.
- resourceQuerier's dispatcher opens a Postgres connection before routing (`index.ts`), so every resourceQuerier route depends on the database.
- There is no record of CSV ingestion runs today: `getCsvImports` lists the caller's own S3 objects (filenames only), there is no runs table, and the ingestion Lambda writes nothing on success.

## Decisions

### Where data comes from

| Data | Source |
|---|---|
| Browser errors | SPA captures and `POST`s to a new resourceQuerier endpoint; stored in Postgres |
| API errors | A shared error-reporting helper in resourceQuerier, called wherever a 5xx response is built (the ~22 route-level catch blocks and the top-level safety net), so the original exception and stack are kept. Covers ResourceQuerierFunction and UserManagerFunction. The Authorizer is excluded: its rejections are 401s, not errors. *(Claude's call.)* |
| Ingestion errors | transactions-bucket-to-db's handler writes to the same table on failure |
| Infra health | A **new metrics Lambda outside the VPC**, in the resourceQuerier stack, behind the same API Gateway and token authorizer (so it's under `/api/v1/...` and the CSP is unchanged). It reads CloudWatch `GetMetricData` for API Gateway, the existing four Lambdas, the DLQ (`ApproximateNumberOfMessagesVisible`), and RDS. It never touches Postgres. Chosen over a `monitoring` VPC endpoint (~$7.30/month) because it costs nothing. *(Owner's decision.)* |
| Recent CSV runs | A new ingestion-runs table, written by the ingestion Lambda on every run (file, user, status, rows inserted, duration, error group if failed). Ships in phase 2. *(Claude's call.)* |

Errors live in **one table** so the overview list, chart and detail page treat all three sources the same way.

**During a database outage**, the Infrastructure tab keeps working, because the metrics Lambda and the role check need no Postgres. The Overview and error detail views are unavailable, because they read the error tables through resourceQuerier's dispatcher. Backend errors that happen while the database is down reach CloudWatch only.

### Error model

- An **error group** (what the table lists) is keyed by a fingerprint: source + error type + normalized message + top in-app frame. Each group has a status: `open` or `resolved`. A resolved group that recurs goes back to `open` ("Ongoing" in the mockup).
- An **event** is one occurrence, holding: timestamp, source, message, stack (raw, plus source-mapped for browser events), route or endpoint, release (commit SHA), user id, browser/OS/theme (browser events), breadcrumbs (browser events), and request linkage (request id, X-Ray trace id, HTTP method/path/status/duration).
- Retention: 30 days of events. Groups persist while they have events.

### Browser capture

- Hooks: `window.onerror`, `unhandledrejection`, a top-level Solid `ErrorBoundary` around the app, the axios response interceptor (5xx and network failures — not 4xx, not cancellations, not the 401 flow), and the global `QueryCache.onError`.
- Breadcrumbs: a ring buffer of the last ~20 events — route changes, API requests (method, path template, status, duration), and clicks identified by `data-testid` only (never element text).
- Release: commit SHA injected at build time.
- Sending: batched, sent with `fetch(..., { keepalive: true })` or `sendBeacon`, fire-and-forget, deduplicated client-side so a render loop can't flood the endpoint. Only authenticated sessions report (errors on the login/register pages before sign-in are not captured in v1).
- **The SPA is not deployed. The owner runs it locally** with the Vite dev server against the production API. So browser stacks already point at real source files and lines, and no source-map upload or symbolication is needed. *(Owner's information.)* If the app is ever deployed, minified stacks become a problem; see Future.
- Exclude errors that come only from Vite's own client or HMR (frames under `/@vite/` or `/@react-refresh`-style client paths, HMR update failures), so editing code doesn't flood the error list.
- Release: the git commit SHA, plus a `-dirty` marker when the working tree has uncommitted changes, injected when the dev server starts (or at build time for `vite preview`).

### Linking a browser error to the API request

API Gateway's request id and the X-Ray trace id are returned on responses; the SPA records them in its request breadcrumbs so the detail page can show "Last API request" with links to the X-Ray trace and the Lambda's CloudWatch logs. The CORS config must expose those headers.

### Admin-only access

- **The role travels in the JWT.** Because the metrics Lambda can't reach the database, the role is added as a claim when the token is issued at login, and the token authorizer passes it on in its context next to `principalId`. Every observability endpoint, both the metrics Lambda and the error endpoints in resourceQuerier, checks that claim and returns 403 unless it's `admin`. This is the real gate. One mechanism everywhere, no per-request DB lookup *(Claude's call)*.
- Trade-off, accepted: a role change takes effect only at the next sign-in, up to 24 h later, since that's the token lifetime.
- The login and session responses must also start including the role for the SPA. Today they don't, so `normalizeUserFromApi` defaults everyone to `'user'`.
- Admin is granted to the owner's account only, by hand, with a one-off SQL statement documented in resourceQuerier. No migration touches `roles`, because that table is owned by the Rails app. *(Claude's call.)*
- SPA: an "Admin" section in the sidebar with an "Observability" link, shown only when `authState.user.role === 'admin'`; the route is wrapped in a reactive guard per CLAUDE.md (a `<Show>` on the same condition, not `onMount`).

### Page (matches the mockups)

- Route `/budget-visualizer/observability` with tabs **Overview** and **Infrastructure**, and `/budget-visualizer/observability/errors/:groupId` for detail. The "Add New Transaction" header is hidden on these routes like other non-transaction pages.
- Overview: four summary cards (errors with change vs. previous period, API 5xx rate, API p95 latency, CSV ingestion status), a stacked errors-over-time chart by source, and a searchable/filterable recent-errors table.
- Infrastructure: API Gateway summary + p95 latency bars, Lambda table, CSV ingestion runs, RDS (CPU, connections, free storage, read latency).
- Error detail: header with source/status badges, "Copy details" and "Mark resolved"; summary strip; stack trace; "What happened before"; Context; Last API request.
- The time range applies to every tab and persists as a query param, like the existing table filters.
- Charts use the existing D3 approach. Light/dark via existing tokens. Where the mockups departed from `theme.css` (dark-mode `--brand-foreground` contrast on the active sidebar item; spreading the Browser/API series apart in lightness), the builder should resolve these in tokens, not one-off colors.

### Phasing (each phase shippable on its own)

1. **Infrastructure tab** — role claim in the JWT and login response, authorizer context, admin check, the out-of-VPC metrics Lambda with CloudWatch read permissions (`cloudwatch:GetMetricData`), the page shell and the Infrastructure tab. The CSV ingestion card shows DLQ depth and the ingestion Lambda's invocations/errors from CloudWatch only. No new storage.
2. **Error capture** — migration for the error and ingestion-runs tables, ingest endpoint, browser capture, resourceQuerier and ingestion write paths, the CSV runs list, Overview tab, detail page with raw stacks.
3. **Detail polish** — breadcrumbs, request/X-Ray linkage, resolve/reopen.

Work spans three repos: this one (page, capture), resourceQuerier (metrics Lambda, error endpoints, role claim + authorizer context, migration, IAM), and transactions-bucket-to-db (ingestion write paths). kylereaves.infrastructure is untouched.

## Future (out of scope now)

- **If the SPA is deployed:** build with hidden source maps, keep them out of the deployed bundle and somewhere private, and symbolicate browser stacks server-side per release. The production CSP already in `vite.config.ts` would then apply. `connect-src` still needs no change, because errors go to the API.

## Privacy

- Never captured: `Authorization` headers, `localStorage`, request/response bodies, element text, transaction or memo content.
- Routes and request paths are recorded as templates or with query-string values stripped, except an allowlist of non-sensitive keys (e.g. `sort`, `limit`, `month`, `week`).
- Error messages from the backend can contain SQL fragments or values; backend writers truncate messages and never include bind parameters.

## Left to the builder

- Table names and exact columns, indexes, and fingerprint normalization rules.
- Endpoint paths and response shapes (under `/api/v1/observability/...`).
- How retention is enforced (scheduled cleanup vs. delete-on-write).
- Caching of CloudWatch responses (a short server-side or `staleTime` cache is fine).
- Client-side dedupe/rate-limit details.
- Component breakdown, following `src/components/transactions/` as the reference layout.
