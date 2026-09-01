# Implementation Prompt

Implement the approved plan or explicit issue acceptance criteria.

Before editing:

- read `AGENTS.md`
- read relevant product requirements
- read relevant architecture docs and ADRs

Constraints:

- keep the diff focused
- do not perform unrelated refactors
- do not introduce dependencies unless necessary
- database changes require migrations
- generated database types must not be edited manually
- add or update tests
- update documentation when behavior, domain language, or architecture changes

After implementation, apply the `sip` verification approach defined in
`docs/ai/paperthin.md`: run the repository validation commands required by `AGENTS.md`
and report actual evidence. Do not claim that an unavailable command passed.

At completion report:

- changed files
- requirement IDs addressed
- tests / validation actually run
- architectural decisions made
- unresolved risks
