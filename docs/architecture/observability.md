# p8ce - Observability

**Status:** Draft  
**Last Updated:** 2026-09-03

## Current implementation

`instrumentation.ts` validates required runtime environment configuration when Next.js
registers instrumentation. GitHub Actions reports CI status, and Playwright uses the
GitHub reporter when running in CI.

## Current limits

No application metrics exporter, distributed tracing integration, error-tracking
destination, log retention policy, alerting policy, dashboard, or service-level objective
is configured in the repository. These are TBDs.

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
