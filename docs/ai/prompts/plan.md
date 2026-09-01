# Plan Prompt

Read `AGENTS.md` and all documentation relevant to the task.

When interpretation is materially ambiguous, apply `readchk` as defined in
`docs/ai/paperthin.md` before planning. Do not ask questions that repository context
already answers. Flag architecture/domain decisions for deliberate review rather than
silently settling them.

Do not modify files yet.

Analyze the issue and produce:

1. Goal
2. Current behavior
3. Relevant requirement IDs
4. Acceptance criteria
5. Affected files / components
6. Proposed implementation
7. Data model implications
8. Authorization / security implications
9. Tests required
10. Documentation updates
11. Risks or unresolved questions

Prefer the smallest coherent solution.
Do not invent requirements.
Call out documentation conflicts explicitly.
