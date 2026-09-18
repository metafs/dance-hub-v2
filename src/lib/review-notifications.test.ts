import { describe, expect, it } from "vitest";

import { reviewNotificationHref, reviewNotificationLabel } from "./review-notifications";

describe("review notifications", () => {
  it("gives every outcome a user-facing label", () => {
    expect(reviewNotificationLabel("organization_application_approved")).toContain("承認");
    expect(reviewNotificationLabel("event_revision_changes_requested")).toContain("変更依頼");
    expect(reviewNotificationLabel("event_cancellation_approved")).toContain("中止申請");
  });

  it("links an approved cancellation to the public event", () => {
    expect(reviewNotificationHref({ event_id: "event-id", kind: "event_cancellation_approved" }))
      .toBe("/events/event-id");
  });
});
