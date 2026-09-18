# ADR-0012: Use native TypeScript runtime validation for environment configuration

**Status:** Accepted

## Context

DANCE HUB requires its public Supabase URL and publishable key to be present and valid before serving requests. The application currently has no validation dependency, and this cross-cutting configuration check has two required scalar values.

## Decision

- Validate required environment configuration at Next.js startup through `instrumentation.ts`.
- Keep the validator in `src/lib/env.ts` and reuse it at Supabase client construction as a defense against runtimes that initialize lazily.
- Use native TypeScript and platform APIs (`String.prototype.trim` and `URL`) rather than adding a schema-validation dependency.
- Require `NEXT_PUBLIC_SUPABASE_URL` to be an HTTP(S) URL and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to be non-blank.

## Alternatives considered

- Add Zod, Valibot, or another schema-validation library.
- Continue validating variables independently at each Supabase client call site.
- Defer configuration failures until Supabase client construction fails.

## Consequences

- Misconfigured deployments fail with an explicit configuration error before application traffic is served.
- The small configuration surface avoids an additional runtime dependency while preserving a typed, unit-tested validation boundary.
- A broader, nested, or user-input validation requirement should reassess a shared schema-validation library rather than extending this validator without limit.

## Revisit when

- Environment validation grows beyond a small set of scalar deployment settings.
- Application input validation needs a common schema language across server actions and UI forms.
