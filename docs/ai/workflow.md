# DANCE HUB — AI Development Workflow

**Status:** Draft

## Goal

Use Codex and Claude Code as complementary agents while keeping product intent, architecture, validation, and merge authority explicit and reproducible.

## Default lifecycle

```text
Requirement / Issue
      |
      v
Plan
      |
      v
Human review when architecture or product meaning changes
      |
      v
Implementation by primary agent
      |
      v
pnpm check / pnpm verify
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

## Implementation

Use `docs/ai/prompts/implement.md` after a plan or sufficiently explicit issue exists.

## Review

Use `docs/ai/prompts/review.md` for independent review.

## Validation

Repository scripts are the validation contract. Agent prose is not evidence that a change works.
