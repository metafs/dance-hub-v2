import { describe, expect, it } from "vitest";

import { parseEventRevisionInput, readEventRevisionFormValues } from "./revision-input";

function baseForm() {
  const formData = new FormData();
  formData.set("organizationId", "organization-id");
  formData.set("eventId", "event-id");
  formData.set("revisionId", "revision-id");
  formData.set("title", "テスト公演");
  return formData;
}

describe("parseEventRevisionInput", () => {
  it("accepts an intentionally incomplete draft", () => {
    const result = parseEventRevisionInput(baseForm(), { forSubmission: false });
    expect(result.success).toBe(true);
  });

  it("returns field-level publication errors instead of one invalid-input error", () => {
    const result = parseEventRevisionInput(baseForm(), { forSubmission: true });
    expect(result).toMatchObject({
      success: false,
      errors: {
        description: ["審査提出には説明が必要です。"],
        eventType: ["審査提出には種別が必要です。"],
        ticketOffers: ["料金、Ticket Link、またはチケット・登録不要のいずれかを設定してください。"],
        contactKind: ["審査提出には問い合わせ手段が必要です。"],
        contactValue: ["審査提出には問い合わせ先が必要です。"],
      },
    });
  });

  it("reports schedule and URL failures on their source fields", () => {
    const formData = baseForm();
    formData.set("startsAt", "2030-04-01T20:00");
    formData.set("endsAt", "2030-04-01T19:00");
    formData.set("ticketUrl", "javascript:alert(1)");
    const result = parseEventRevisionInput(formData, { forSubmission: false });
    expect(result).toMatchObject({
      success: false,
      errors: {
        venueId: ["開始日時を設定する場合は会場を選択してください。"],
        endsAt: ["終了日時は開始日時より後にしてください。"],
        ticketUrl: ["httpまたはhttpsのURLを入力してください。"],
      },
    });
  });

  it("requires a start time whenever a Venue is selected", () => {
    const formData = baseForm();
    formData.set("venueId", "venue-id");
    expect(parseEventRevisionInput(formData, { forSubmission: false })).toMatchObject({
      success: false,
      errors: { startsAt: ["会場を設定する場合は開始日時を入力してください。"] },
    });
  });

  it("keeps submitted field and ticket offer values available after validation errors", () => {
    const formData = baseForm();
    formData.set("description", "  entered description  ");
    formData.set("startsAt", "2030-04-01T20:00");
    formData.set("ticketOfferKey", "offer-1");
    formData.set("ticketOffer.offer-1.priceType", "range");
    formData.set("ticketOffer.offer-1.label", "  Advance  ");
    formData.set("ticketOffer.offer-1.currency", "JPY");
    formData.set("ticketOffer.offer-1.minAmountMinor", "broken");
    formData.set("ticketOffer.offer-1.maxAmountMinor", "2500");

    expect(readEventRevisionFormValues(formData)).toMatchObject({
      description: "  entered description  ",
      startsAt: "2030-04-01T20:00",
      ticketOffers: [{
        key: "offer-1",
        priceType: "range",
        label: "  Advance  ",
        currency: "JPY",
        minAmountMinor: "broken",
        maxAmountMinor: "2500",
      }],
    });
  });

  it("maps schema constraint failures to typed fields", () => {
    const formData = baseForm();
    formData.set("artistRole", "x".repeat(121));
    formData.set("applicationDeadline", "2030-02-30T19:00");
    const result = parseEventRevisionInput(formData, { forSubmission: false });
    expect(result).toMatchObject({
      success: false,
      errors: {
        artistRole: ["クレジット表記は120文字以内で入力してください。"],
        applicationDeadline: ["有効な応募締切を入力してください。"],
      },
    });
  });

  it("uses the apply deadline contract without requiring a schedule", () => {
    const formData = baseForm();
    formData.set("description", "募集内容");
    formData.set("eventType", "audition");
    formData.set("applicationDeadline", "2030-04-01T19:00");
    formData.set("noRegistrationRequired", "on");
    formData.set("contactKind", "email");
    formData.set("contactValue", "contact@example.com");
    const result = parseEventRevisionInput(formData, { forSubmission: true });
    expect(result).toMatchObject({ success: true });
  });
});
