# Testing Robustness & Coverage Improvement Plan

## Current Coverage Snapshot
Running `vitest --coverage` (excluding the failing lint/typecheck meta-test) shows that our overall statement coverage is only ~28%, with whole directories like `src/cli.ts`, `src/service.ts`, the web dashboard, and the supporting scripts currently untested.【4093f7†L1-L80】 To raise coverage to 90%, we need targeted suites that exercise these large, uncovered areas rather than only deepening tests where we already exceed 70%.

## High-Priority Backend Gaps

### 1. CLI command surface (`src/cli.ts`)
* **Current state:** Every subcommand (run, validate, schedule add/list/update/delete/enable/disable/next) currently executes real logging, filesystem, database, and process exits without an abstraction layer, making them untestable in isolation.【F:src/cli.ts†L1-L559】
* **Recommendations:**
  * Extract command factories that accept injected dependencies (logger, database, task runner, schedule utilities) so Vitest can provide fakes.
  * Use `execa` or `vitest`'s `spawn` helpers to run the compiled CLI in a temp workspace, asserting on exit codes and stdout/stderr for success/error scenarios (e.g., missing flags, dry-run mode, scheduling validation failures, environment variable requirements).
  * Mock transports (`OpenAITransport`, `DryRunTransport`) and database interactions to keep tests hermetic while verifying option parsing, retry configuration, and checkpoint handling branches.
  * Cover error taxonomy integration by simulating thrown errors and asserting exit codes, which will also exercise `ErrorTaxonomy` mappings from the CLI surface.

### 2. Windows service & scheduler orchestration (`src/service.ts`)
* **Current state:** The service wrapper starts cron jobs, records logs, and persists executions, but none of these pathways are exercised by tests, and several code paths (heartbeat, graceful shutdown, execution failure handling) remain unverified.【F:src/service.ts†L1-L314】
* **Recommendations:**
  * Refactor `GPTTaskService` to accept injected dependencies (cron scheduler, database, transports, timers) so we can simulate scheduling without real timers.
  * Add unit tests that:
    * Verify `start()` loads tasks and registers cron jobs, while `stop()` cancels them and closes the database.
    * Assert that execution success/failure updates task execution records and logs service events, using spies on the injected database methods.
    * Exercise graceful shutdown signal handlers by calling the exported `GPTTaskService` methods directly.
  * Provide an integration-style test that drives a fake cron tick and ensures a batch run invokes `TaskRunner.runFromFile` with the correct CLI options for dry-run vs. live transports.

### 3. Persistence layer (`src/database/database.ts` and `src/lib/database.ts`)
* **Current state:** Both the Node CLI and Next.js app maintain separate database implementations with identical APIs, but neither is covered by tests; inserts, updates, metrics aggregation, and log retrieval currently rely on manual testing.【F:src/database/database.ts†L1-L437】【F:src/lib/database.ts†L1-L199】
* **Recommendations:**
  * Use temporary directories (`fs.mkdtemp`) in Vitest to instantiate the SQLite-backed `Database`, verifying round-trips for task executions, scheduled tasks, and service logs (create, update, list, enable/disable).
  * Add tests for failure scenarios: invalid paths, attempting to update missing IDs, and ensuring SQL constraints (e.g., status check) produce meaningful errors.
  * Consolidate duplicate database code into a shared module to avoid double the testing burden, or at minimum share a common test suite executed against both implementations via parameterized tests.
  * Extend metrics tests to populate synthetic execution rows and assert calculated aggregates (totals, last execution timestamps) before wiring them into dashboard/API tests.

## Web Dashboard & API Coverage

### 4. Next.js pages & components
* **Current state:** The dashboard and task management pages fetch data from APIs, render charts, and expose user interactions, but they are entirely untested. They currently rely on mock data and external APIs without verification of loading states, empty states, or interactions.【F:src/components/Dashboard.tsx†L1-L200】【F:src/app/tasks/page.tsx†L1-L160】【F:src/app/page.tsx†L1-L10】
* **Recommendations:**
  * Introduce React Testing Library with Vitest + JSDOM to render these components, mocking `fetch` to return fixture responses and verifying loading spinners, error fallbacks, and data visualizations (e.g., pie chart segments, metric cards).
  * For `TasksPage`, test transitions between mock data, empty lists, modal visibility toggles, and status badge rendering to cover branch-heavy JSX.
  * As soon as real API endpoints are available, swap hardcoded mocks for dependency-injected data loaders so we can drive the same tests with live responses.

### 5. Next.js API routes
* **Current state:** API handlers for metrics, status, and scheduled tasks orchestrate database operations but lack request/response validation tests, leaving edge cases (invalid JSON, DB failures, validation errors) uncovered.【F:src/app/api/scheduled-tasks/route.ts†L1-L48】
* **Recommendations:**
  * Use `@vitest/ui` or `supertest` with Next's route handlers to simulate GET/POST requests, injecting a mocked database module that exercises success and failure branches.
  * Verify status codes, JSON payload structures, and validation error messaging to align with frontend expectations.
  * Combine these with the persistence tests to ensure coverage across both server and client usage of the data layer.

## Supporting Improvements
* **Scripts directory coverage:** Our coverage report is heavily dragged down by Node helper scripts that are not meant to be unit tested (`scripts/*.js`). Either exclude them via `coverage.exclude` in `vitest.config.ts` or add smoke tests that invoke them with faked file systems to hit the main code paths.【4093f7†L1-L38】
* **Type-check meta test:** The failing `tests/lint-and-typecheck.test.ts` prevents full coverage runs; convert this into a CI-only task (e.g., separate npm script) or mock the `npm run type-check` call so the coverage suite can run to completion locally.
* **Coverage thresholds:** After new suites are in place, enable per-directory thresholds (e.g., 90% statements/branches/functions/lines for `src/**`) while allowing lower thresholds for intentionally excluded scripts or generated code.

## Roadmap to 90%
1. **Backend foundation (short term):** Add tests for database CRUD/metrics and refactorable portions of the CLI (option parsing, error handling) to push backend statement coverage above 60% quickly.
2. **Service orchestration (mid term):** Introduce dependency-injected service tests and cron simulations to cover `GPTTaskService` pathways and ensure scheduler resilience.
3. **Web & API (mid term):** Build React Testing Library suites and API handler tests to close the gap on the dashboard, tasks UI, and HTTP interfaces.
4. **Polish & thresholds (long term):** Trim or test Node scripts, consolidate duplicate persistence logic, and enforce coverage gates in CI once the preceding suites stabilize.

Executing this plan should raise the currently uncovered directories to parity with the already well-tested transports, retry logic, and IO utilities, putting a 90% organization-wide coverage target within reach.
