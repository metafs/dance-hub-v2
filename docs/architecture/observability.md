# p8ce - Observability

**Status:** Draft  
**Last Updated:** 2026-09-23

## Current implementation

`instrumentation.ts` validates required runtime environment configuration when Next.js
registers instrumentation. GitHub Actions reports CI status, and Playwright uses the
GitHub reporter when running in CI.

### Server request errors (ADR-0023)

`instrumentation.ts` exports `onRequestError`, which Next.js calls for every uncaught
error in a page render, Route Handler, Server Action, or proxy. It writes one JSON line
built by `src/lib/observability/request-error.ts`:

| Field | Meaning |
| --- | --- |
| `level`, `event` | Always `error` and `request_error`, for filtering |
| `name`, `message`, `stack` | The error; message and stack are length-bounded |
| `digest` | The value Next.js shows on its error page, so a reported page can be matched |
| `method`, `path` | The request, with the query string and fragment removed |
| `routePath`, `routeType`, `routerKind` | The route pattern and whether it was a render, route, action, or proxy |
| `renderSource`, `revalidateReason` | Present only when Next.js supplies them |

Request headers, cookies, and query strings are never recorded: they carry sessions
and personal data, and the route plus the error identifies the fault.

`wrangler.jsonc` enables Workers Logs (`observability.enabled`, full head sampling),
which stores console output and indexes the fields of JSON lines. How to read them is
in [`docs/ops/runbooks/deployment.md`](../ops/runbooks/deployment.md).

## Current limits

Errors are recorded but nobody is notified: there is no alerting policy. There is also
no application metrics exporter, distributed tracing integration, log retention policy
beyond the Workers Logs default, dashboard, or service-level objective. These are TBDs.
Errors handled inside the application (for example a query error a component logs and
renders around) are not request errors and are not captured by `onRequestError`.

[`docs/ops/runbooks/`](../ops/runbooks/README.md) documents the deployment, migration
rollback, media recovery, and moderation procedures. Those runbooks are written and
unrehearsed: no staging or production environment exists to execute them against. They
describe intended procedure, not verified procedure, and they do not substitute for the
detection this document is missing — each one relies on a human noticing the symptom
first.

## Evidence available today

The repository-native evidence is the validation contract in
[testing](testing.md): application lint/type/unit/build checks, local Supabase
database/RLS checks, generated database-type freshness, and critical E2E coverage in
CI. This evidence verifies implementation paths; it does not establish production
monitoring.
