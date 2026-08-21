# DANCE HUB — Testing Strategy

**Status:** Draft

## Layers

### Unit
Domain and pure application logic.

### Integration
Database-backed behavior, authorization rules, server-side use cases, and migrations where practical.

### E2E
Critical user journeys.

Initial critical journeys:
- Visitor: event list -> event detail
- Visitor: artist detail -> related event
- Visitor: venue detail -> related event
- Organizer: login -> create draft event -> publish

## Standard validation contract

Once application tooling is installed:

- `pnpm check`: lint + typecheck + unit tests
- `pnpm verify`: check + build + critical E2E
