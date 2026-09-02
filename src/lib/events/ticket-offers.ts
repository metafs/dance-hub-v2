export const ticketPriceTypes = [
  "fixed",
  "free",
  "range",
  "donation",
  "pay_what_you_can",
  "sliding_scale",
  "dynamic",
  "included",
] as const;

export type TicketPriceType = (typeof ticketPriceTypes)[number];

export type TicketOfferInput = {
  price_type: TicketPriceType;
  label: string | null;
  currency: string | null;
  amount_minor: number | null;
  min_amount_minor: number | null;
  max_amount_minor: number | null;
  notes: string | null;
  display_order: number;
};

export type TicketOfferDraft = {
  key: string;
  priceType: TicketPriceType;
  label?: string | null;
  currency?: string | null;
  amountMinor?: string | number | null;
  minAmountMinor?: string | number | null;
  maxAmountMinor?: string | number | null;
  notes?: string | null;
};

const priceTypeSet = new Set<string>(ticketPriceTypes);

function formText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function minorUnit(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function validAmounts(offer: Omit<TicketOfferInput, "display_order">) {
  const { price_type: type, currency, amount_minor: amount, min_amount_minor: min, max_amount_minor: max } = offer;
  if (currency && !/^[A-Z]{3}$/.test(currency)) return false;
  if (type === "fixed" || type === "sliding_scale") {
    return Boolean(currency && amount && min === null && max === null && (type !== "sliding_scale" || offer.label));
  }
  if (["free", "donation", "dynamic", "included"].includes(type)) {
    return currency === null && amount === null && min === null && max === null;
  }
  if (type === "range") {
    return Boolean(currency && amount === null && min && max && BigInt(min) <= BigInt(max));
  }
  return amount === null && max === null && ((currency === null && min === null) || Boolean(currency && min));
}

export function parseTicketOffers(formData: FormData): TicketOfferInput[] | null {
  const keys = formData.getAll("ticketOfferKey").map(String);
  const offers: TicketOfferInput[] = [];

  for (const [displayOrder, key] of keys.entries()) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) return null;
    const field = (name: string) => formText(formData, `ticketOffer.${key}.${name}`);
    const priceType = field("priceType");
    if (!priceTypeSet.has(priceType)) return null;

    const rawAmount = field("amountMinor");
    const rawMin = field("minAmountMinor");
    const rawMax = field("maxAmountMinor");
    const amount = rawAmount ? minorUnit(rawAmount) : null;
    const min = rawMin ? minorUnit(rawMin) : null;
    const max = rawMax ? minorUnit(rawMax) : null;
    if ((rawAmount && !amount) || (rawMin && !min) || (rawMax && !max)) return null;

    const label = field("label");
    if (label.length > 120) return null;
    const offer = {
      price_type: priceType as TicketPriceType,
      label: label || null,
      currency: priceType === "pay_what_you_can" && min === null
        ? null
        : field("currency").toUpperCase() || null,
      amount_minor: amount,
      min_amount_minor: min,
      max_amount_minor: max,
      notes: field("notes") || null,
    };
    if (!validAmounts(offer)) return null;
    offers.push({ ...offer, display_order: displayOrder });
  }

  return offers;
}

function formatMinorUnit(value: string | number, currency: string) {
  const formatter = new Intl.NumberFormat("ja-JP", { style: "currency", currency });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  if (fractionDigits === 0) return formatter.format(BigInt(value));

  const divisor = BigInt(10) ** BigInt(fractionDigits);
  const amount = BigInt(value);
  const whole = amount / divisor;
  const fraction = String(amount % divisor).padStart(fractionDigits, "0");
  return formatter.formatToParts(whole).map((part) => part.type === "fraction" ? fraction : part.value).join("");
}

export function ticketOfferPrice(offer: Omit<TicketOfferInput, "display_order" | "amount_minor" | "min_amount_minor" | "max_amount_minor"> & {
  amount_minor: string | number | null;
  min_amount_minor: string | number | null;
  max_amount_minor: string | number | null;
}) {
  const { price_type: type, currency, amount_minor: amount, min_amount_minor: min, max_amount_minor: max } = offer;
  if ((type === "fixed" || type === "sliding_scale") && currency && amount) return formatMinorUnit(amount, currency);
  if (type === "range" && currency && min && max) return `${formatMinorUnit(min, currency)}〜${formatMinorUnit(max, currency)}`;
  if (type === "free") return "無料";
  if (type === "donation") return "カンパ制";
  if (type === "pay_what_you_can") return currency && min ? `Pay What You Can（最低 ${formatMinorUnit(min, currency)}）` : "Pay What You Can";
  if (type === "sliding_scale") return "Sliding Scale";
  if (type === "dynamic") return "Dynamic Pricing";
  return "料金に含まれます";
}
