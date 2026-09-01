# ADR-0007: Publish Events immediately without per-Event Administrator approval

**Status:** Proposed

## Context

`docs/product/requirements.md` Open Questions asked whether publishing an individual Event should require Administrator approval, on an axis separate from the Organization-level pre-approval already decided in ADR-0006.

The two gates answer different questions. ADR-0006 reviews the *actor* ("is this a real, legitimate organization?") once per Organization. A per-Event gate would review the *content* ("is this listing accurate and in scope?") on every publish. An approved Organization can still post wrong dates, duplicate Venues, out-of-domain listings, or images it has no rights to, so the second gate is not redundant in principle.

The cost profile of the two gates is very different. Organization approval is bounded: one review per Organization, ever. Event approval is unbounded and recurring, and the decision to let Festivals contain child Events (ADR-0009) multiplies it further — one festival can produce dozens of reviewable child Events. If edits to already-published Events also re-entered review, the gate would become continuous rather than per-publish.

## Decision

- A member of an `approved` Organization publishing an Event moves it directly to `Published`. No Administrator step intervenes.
- `Event.status` remains the three values of REQ-EVENT-005 (`Draft` / `Published` / `Cancelled`). No `pending_review` state is introduced.
- Editing an already-published Event takes effect immediately and does not return the Event to review.
- Human review of publishing rights stays concentrated in the single Organization approval step (REQ-ORG-005, ADR-0006).
- Quality control for published Events is therefore after the fact, not preventive.

## Alternatives considered

- Approve every Event before publish: rejected for MVP. It adds a second, unbounded human queue on top of the one ADR-0006 already created, and ADR-0006 itself flags Administrator review capacity as its main risk. It would also make the Organizer flow in the Success Criteria ("publish", then "edit after publishing") depend on an unspecified review latency.
- Risk-based approval for the `apply` Event Types only (`audition` / `open_call` / `residency`), on the grounds that these solicit applications from individuals and carry more fraud risk than a performance listing: considered seriously and rejected for MVP as premature, since it requires defining and operating a review queue before any evidence of abuse exists. This is the most likely form for a future gate to take if one becomes necessary.
- Publish immediately plus a viewer reporting / flagging queue: rejected as additional MVP surface area beyond what the current scope defines. It remains available post-MVP.

## Consequences

- Incorrect or abusive content can be publicly visible before any human sees it. The exposure window is bounded only by how quickly an Administrator notices and acts.
- This decision depends on Administrators being able to take a published Event down. That capability is currently implied by the Administrator's product role ("必要に応じて公開状態を管理する") but has no corresponding functional requirement. Until one exists, the mitigation this decision assumes is not actually specified. Tracked in `docs/product/requirements.md` Open Questions.
- Organizers get an immediate publish path, which keeps the MVP Organizer flow simple and self-service.
- Adding a review state later is cheap at the schema level (`ALTER TYPE ... ADD VALUE` on the status enum), but expensive at the expectation level: Organizers accustomed to immediate publishing would experience its introduction as a regression.

## Revisit when

- Spam, impersonation, or materially incorrect listings from approved Organizations appear in real data.
- Fraudulent or exploitative postings appear specifically among the `apply` Event Types, which would argue for the risk-based alternative above rather than a blanket gate.
- Administrator takedown workload grows to where preventing bad listings is cheaper than removing them.
