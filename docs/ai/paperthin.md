# Paperthin Design Patterns for DANCE HUB

**Status:** Draft
**Upstream:** [LilMGenius/paperthin](https://github.com/LilMGenius/paperthin)

## Purpose

Paperthin is an upstream collection of agent skills. DANCE HUB does not install or
copy those skills verbatim. This document selects six of their design patterns and
adapts them to the repository's existing AI workflow.

The patterns help an agent prevent requirement misreads, resist unnecessary
implementation and overengineering, correct artifact drift after iteration, avoid
duplicated sources of truth, verify completed implementation, and subject important
architecture decisions to adversarial review. They are reasoning aids, not product
requirements, architecture decisions, or substitutes for repository validation and
human review.

## Authority

When guidance differs, use this order:

1. Issue acceptance criteria
2. Product requirements
3. Accepted ADRs
4. Architecture and security documentation
5. Repository validation
6. Paperthin skill guidance as adapted in this document

Paperthin must never override a higher authority. If higher authorities conflict and
their precedence does not resolve the conflict, stop and report it rather than using
a Paperthin pattern to invent a resolution. Repository rules in `AGENTS.md`, including
scope and the multi-agent workflow, remain binding.

## Invocation model

- **Routine / model-invoked:** `readchk`, `sip`, `re0`, and `ssotize` may be selected
  by an agent when their conditions apply. This is not a requirement to run all four.
- **Deliberate / human-invoked:** `hate` and `feynman` run only when a human requests
  them or explicitly approves their use for a decision. They are not an automatic
  checklist for routine implementation.

These names are concise labels for behaviors described below; they do not imply that
an upstream Skill is installed or callable in the repository.

## Skill catalog

### `readchk` — check the reading before substantial work

- **Purpose:** Restate the task, its acceptance criteria, constraints, and material
  ambiguities so a requirement misread is caught before planning or implementation.
- **Use when:** Work changes a domain model, an issue has several acceptance criteria,
  or instructions use ambiguous references such as “this,” “same as existing,” or
  “appropriately.”
- **Do not use when:** Relevant repository context resolves the wording. Do not create
  confirmation questions merely to demonstrate that a check occurred.
- **DANCE HUB example:** Before changing the Event–Artist relationship, distinguish
  Artist, Organization, and Credit using the glossary and list the affected requirement
  IDs; ask only about ambiguity that those sources cannot resolve.
- **Behavior:** Read-only. The result can inform a plan but does not edit an artifact.

### `sip` — verify the implementation in its native repository

- **Purpose:** After implementation, gather reproducible evidence that the result
  satisfies the task and repository contract.
- **Use when:** Implementation or documentation edits are complete and ready for
  verification.
- **Do not use when:** It would replace required validation with agent prose, an
  invented command, or an upstream-specific check.
- **DANCE HUB example:** Inspect the diff, run the relevant focused checks, then use
  `pnpm check` for fast validation and `pnpm verify` for full validation when those
  scripts exist.
- **Behavior:** Primarily read/execute. It may expose defects that require a separate,
  focused edit. Never claim a command passed unless it was actually present and ran
  successfully; while the application scaffold and scripts do not exist, report that
  limitation explicitly.

### `re0` — restore the current correct v0 of a drifted artifact

- **Purpose:** Consolidate an artifact that accumulated stale branches, transitional
  wording, or internal inconsistency through iteration into the smallest coherent
  current version.
- **Use when:** Drift is demonstrated in a changed artifact or one clearly coupled to
  the current change.
- **Do not use when:** Cleanup is unrelated to the feature PR, or “cleaner” would mean
  redesigning settled behavior.
- **DANCE HUB example:** After several revisions to an Event publishing plan, remove
  obsolete alternatives from that plan while preserving the approved Organization
  approval requirement.
- **Behavior:** Mutating and narrowly scoped. Establish the current authoritative
  meaning before editing, and review the resulting diff for accidental semantic change.

### `ssotize` — recover a single source of truth

- **Purpose:** Detect a domain definition, requirement, or architectural fact repeated
  across artifacts and route each consumer to one canonical source.
- **Use when:** The same truth is scattered, repeated copies can drift, or conflicting
  copies have already appeared.
- **Do not use when:** Similar text serves distinct scopes, or authority is unclear.
  Never silently merge contradictory claims.
- **DANCE HUB example:** If Artist ownership rules are re-explained in prompts, replace
  those copies with references to the product requirement and accepted ADR rather than
  choosing new wording in every prompt.
- **Behavior:** Begin with a read-only audit that identifies copies, the proposed
  canonical source, conflicts, and a mutation plan. Edit only after the authority is
  established or a human resolves ambiguity.

### `hate` — test the load-bearing objection

- **Purpose:** Challenge an architecture, domain, or infrastructure proposal with its
  single most load-bearing objection and the smallest test that could validate or
  falsify the underlying assumption.
- **Use when:** Deliberately requested for a dependency, schema, authorization,
  Cloudflare/Supabase architecture, storage choice, or domain-model decision.
- **Do not use when:** Reviewing routine implementation, generating a list of generic
  risks, or replacing the independent secondary-agent review.
- **DANCE HUB example:** For a proposal to duplicate Venue names on Event rows, object
  that it breaks referential integrity and test the claimed performance need with one
  representative query before accepting denormalization.
- **Behavior:** Read-only analysis. It recommends a minimal validation; it does not
  authorize or implement the decision.

### `feynman` — test whether an ADR candidate can be explained

- **Purpose:** Check that an architecture decision's problem, mechanism, alternatives,
  trade-offs, and DANCE HUB-specific reason can be explained plainly before it becomes
  an ADR.
- **Use when:** Deliberately requested for a decision that may require a new or updated
  ADR.
- **Do not use when:** A decision is already governed by an accepted ADR, or the only
  justification is “it feels right” or “it is common practice.” Those are gaps to
  resolve, not explanations to polish.
- **DANCE HUB example:** Before recording a media storage choice, explain why the
  current workload needs it, how authorization and lifecycle work, what simpler option
  was rejected, and what evidence would cause reconsideration.
- **Behavior:** Read-only analysis. ADR creation or architecture changes remain a
  separate, human-reviewed action under repository rules.

## Lifecycle integration

The canonical lifecycle remains in `docs/ai/workflow.md`. In summary, `readchk` can
clarify a requirement before planning. A plan that introduces an architecture or
domain decision may receive deliberate `hate` review, and an ADR candidate may receive
deliberate `feynman` review, before human review. Implementation is followed by `sip`
and repository-native validation. Only observed artifact drift triggers `re0`; only
observed source-of-truth scatter triggers the read-only audit phase of `ssotize`.
Independent secondary-agent review and human merge still follow. The patterns are
conditional branches, not six mandatory gates.

## Scope of this integration

The initial integration is intentionally limited to `readchk`, `sip`, `re0`,
`ssotize`, `hate`, and `feynman`. It does not add `re0-loop`, `re0-work`, `re0-memo`,
`macrothink`, `prism`, `debloat`, `re0-release`, or `re0-merge` to the standard flow.
Adding another upstream pattern requires a separate, justified change to this
canonical document.
