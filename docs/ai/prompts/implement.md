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

Run the repository validation commands required by `AGENTS.md`.

At completion report:

- changed files
- requirement IDs addressed
- tests / validation actually run
- architectural decisions made
- unresolved risks
