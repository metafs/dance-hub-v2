# ADR-0011: Separate structured Ticket Offers from external Ticket Links

**Status:** Accepted
**Accepted:** 2026-09-02

## Context

An Event Revision can store external ticket-sales and registration URLs, but it cannot represent the announced price itself. Dance events use fixed and ranged prices as well as free, donation, pay-what-you-can, sliding-scale, dynamic, and pass-included models. DANCE HUB does not sell tickets or calculate prices.

## Decision

`event_ticket_offers` stores structured pricing as an Event Revision child. `event_ticket_links` continues to store external sales and registration destinations. The two collections are independent and are not related to each other or to individual Event Schedules in the MVP.

Ticket Offer uses the enum values `fixed`, `free`, `range`, `donation`, `pay_what_you_can`, `sliding_scale`, `dynamic`, and `included`. Human-facing categories such as advance, door, student, U25, Access, and Support remain free-form `label` values. `notes` explains conditions and what an `included` offer belongs to.

Money is stored as non-negative integer minor units. Currency uses an uppercase ISO 4217 alpha-3 code. `fixed` has one exact amount, `range` has minimum and maximum amounts, `pay_what_you_can` may have a minimum, and each `sliding_scale` level is a separately labelled exact-amount Offer. The non-numeric `free`, `donation`, `dynamic`, and `included` types do not carry currency or amount values.

An Event Revision satisfies the ticket/participation part of publication validation when it has at least one valid Ticket Offer, at least one valid Ticket Link, or explicitly sets `no_registration_required`.

Ticket Offers inherit Event Revision access and lifecycle rules: Organization Members may edit them only for `draft` or `changes_requested` Revisions, Platform Admin may review them, anonymous readers see only Offers belonging to the current approved Revision, and post-publication Draft creation copies Offers from the published Revision.

## Alternatives considered

- Add price columns to `event_ticket_links`: rejected because a price may be announced before a sales URL exists, and multiple prices may share several external destinations.
- Store one free-form price string on Event Revision: rejected because it prevents reliable price-type and currency-aware presentation while losing individual offers.
- Relate Offers to Links or Schedules: deferred because neither mapping is required for MVP and both introduce unsupported editing and display semantics.
- Model ticket sales and payment inside DANCE HUB: rejected as outside MVP scope.

## Consequences

- Price changes are preserved through Event Revision history instead of mutating the stable Event.
- Public rendering must format minor-unit amounts according to currency while preserving human labels and notes.
- Dynamic Pricing is descriptive only; DANCE HUB neither calculates nor synchronizes current prices.
- Detailed seat categories, eligibility rules, Festival Pass sales, price tracking, and notifications remain outside the model.

## Revisit when

- A real use case requires linking a price to a Schedule or sales destination.
- External ticket-service synchronization becomes a product requirement.
- Structured seat categories, discount eligibility, subscriptions, or pass sales are introduced.
