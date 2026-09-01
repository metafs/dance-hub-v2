# DANCE HUB — AI Development Workflow

**Status:** Draft

## Goal

Use Codex and Claude Code as complementary agents while keeping product intent, architecture, validation, and merge authority explicit and reproducible.

## Default lifecycle

```text
Requirement / Issue
      |
      v
readchk when interpretation needs confirmation
      |
      v
Plan
      |
      +-- architecture / domain decision
      |        +-- hate when deliberately requested
      |        +-- feynman for an ADR candidate when deliberately requested
      |
      v
Human review when architecture or product meaning changes
      |
      v
Implementation by primary agent
      |
      v
sip: repository-native verification
      |
      v
pnpm check / pnpm verify (when available)
      |
      +-- observed artifact drift --> re0 (related artifacts only)
      +-- observed truth scatter --> ssotize read-only audit first
      |
      v
Review by secondary agent
      |
      v
Human merge
```

## Multi-agent rule

`1 Issue = 1 Branch = 1 Worktree = 1 Primary Agent`

Do not let Codex and Claude Code concurrently edit the same worktree.

The secondary agent should usually receive the issue, relevant docs, and diff for review.

## Source-of-truth rule

Agents must derive product behavior from repository documentation and issue acceptance criteria. They must not silently fill product gaps with generic best practices.

## Planning

Use `docs/ai/prompts/plan.md` for non-trivial tasks.

Use `readchk` before planning when the issue's interpretation materially affects the
work. `hate` applies only to architecture or domain decisions when deliberately
requested; `feynman` likewise tests an ADR candidate when deliberately requested.

## Implementation

Use `docs/ai/prompts/implement.md` after a plan or sufficiently explicit issue exists.
After implementation, use `sip` to connect the claimed result to repository-native
verification. Apply `re0` only to drifted artifacts in or clearly related to the change.
If a truth is scattered, begin `ssotize` with a read-only audit rather than silently
merging copies.

## Review

Use `docs/ai/prompts/review.md` for independent review.

## Validation

Repository scripts are the validation contract. Agent prose is not evidence that a change works.

The selected Paperthin patterns and their invocation rules are defined once in
`docs/ai/paperthin.md`. They supplement this lifecycle; they do not replace validation,
independent secondary-agent review, or human merge, and they are not an execute-all
checklist.
