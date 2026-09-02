import { describe, expect, it } from "vitest";

import { parseTicketOffers, ticketOfferPrice } from "./schema";

function offerForm(values: Record<string, string>) {
  const formData = new FormData();
  formData.set("ticketOfferKey", "offer-1");
  for (const [name, value] of Object.entries(values)) formData.set(`ticketOffer.offer-1.${name}`, value);
  return formData;
}

describe("parseTicketOffers", () => {
  it("parses fixed prices as integer minor units and normalizes currency", () => {
    const offers = parseTicketOffers(offerForm({ priceType: "fixed", label: "一般前売", currency: "jpy", amountMinor: "3000" }));
    expect(offers).toEqual([{ price_type: "fixed", label: "一般前売", currency: "JPY", amount_minor: "3000", min_amount_minor: null, max_amount_minor: null, notes: null, display_order: 0 }]);
  });

  it("accepts a range and a pay-what-you-can minimum", () => {
    const range = parseTicketOffers(offerForm({ priceType: "range", currency: "EUR", minAmountMinor: "1000", maxAmountMinor: "3000" }));
    const payWhatYouCan = parseTicketOffers(offerForm({ priceType: "pay_what_you_can", currency: "GBP", minAmountMinor: "500" }));
    expect(range?.[0]).toMatchObject({ min_amount_minor: "1000", max_amount_minor: "3000" });
    expect(payWhatYouCan?.[0]).toMatchObject({ min_amount_minor: "500", max_amount_minor: null });
  });

  it("accepts pay-what-you-can without a minimum and discards the unused currency", () => {
    const offers = parseTicketOffers(offerForm({ priceType: "pay_what_you_can", currency: "JPY" }));
    expect(offers?.[0]).toMatchObject({ currency: null, min_amount_minor: null });
  });

  it("rejects invalid ranges and numeric free offers", () => {
    expect(parseTicketOffers(offerForm({ priceType: "range", currency: "JPY", minAmountMinor: "3000", maxAmountMinor: "1000" }))).toBeNull();
    expect(parseTicketOffers(offerForm({ priceType: "free", currency: "JPY", amountMinor: "0" }))).toBeNull();
  });

  it("rejects unlabeled sliding scales and values outside PostgreSQL bigint", () => {
    expect(parseTicketOffers(offerForm({ priceType: "sliding_scale", currency: "JPY", amountMinor: "1000" }))).toBeNull();
    expect(parseTicketOffers(offerForm({ priceType: "fixed", currency: "JPY", amountMinor: "9223372036854775808" }))).toBeNull();
  });
});

describe("ticketOfferPrice", () => {
  it("formats JPY and EUR minor units", () => {
    expect(ticketOfferPrice({ price_type: "fixed", label: null, currency: "JPY", amount_minor: "3000", min_amount_minor: null, max_amount_minor: null, notes: null })).toContain("3,000");
    expect(ticketOfferPrice({ price_type: "fixed", label: null, currency: "EUR", amount_minor: "1250", min_amount_minor: null, max_amount_minor: null, notes: null })).toContain("12.50");
    expect(ticketOfferPrice({ price_type: "fixed", label: null, currency: "JPY", amount_minor: "9223372036854775807", min_amount_minor: null, max_amount_minor: null, notes: null })).toContain("9,223,372,036,854,775,807");
  });
});
