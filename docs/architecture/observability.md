# DANCE HUB - Observability

**Status:** Draft  
**Last Updated:** 2026-09-03

## Current implementation

`instrumentation.ts` validates required runtime environment configuration when Next.js
registers instrumentation. GitHub Actions reports CI status, and Playwright uses the
GitHub reporter when running in CI.

## Current limits

No application metrics exporter, distributed tracing integration, error-tracking
destination, log retention policy, alerting policy, dashboard, service-level objective,
or incident runbook is configured in the repository. These are TBDs.

## Evidence available today

The repository-native evidence is the validation contract in
[testing](testing.md): application lint/type/unit/build checks, local Supabase
database/RLS checks, generated database-type freshness, and critical E2E coverage in
CI. This evidence verifies implementation paths; it does not establish production
monitoring.
