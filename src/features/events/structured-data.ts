import type { TicketPriceType } from "@/features/revisions/schema";
import type { ArtistType } from "@/features/shared-entities/schema";
import { prefectureName } from "@/features/shared-entities/schema";
import { tokyoDateKey } from "@/lib/datetime";

/**
 * schema.org `Event` data for an Event's public page (DH-26).
 *
 * The builder is pure: the page passes in the approved Revision it already
 * rendered, so the structured data can never describe anything the Visitor
 * cannot see. It returns an empty list whenever the Event cannot be expressed
 * as an attendable schema.org Event — an `apply` Event with no Schedule has no
 * `startDate`, and marking it up would be a claim search engines treat as an
 * error.
 */

export type StructuredVenue = {
  id: string;
  name: string;
  prefecture: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
};

export type StructuredSchedule = {
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  venue: StructuredVenue | null;
};

export type StructuredContributor = {
  id: string;
  name: string;
  artistType: ArtistType | null;
};

export type StructuredOffer = {
  priceType: TicketPriceType;
  label: string | null;
  currency: string | null;
  amountMinor: string | number | null;
  minAmountMinor: string | number | null;
  maxAmountMinor: string | number | null;
};

export type StructuredFestivalChild = {
  id: string;
  title: string;
  schedules: readonly StructuredSchedule[];
};

export type StructuredEventInput = {
  eventId: string;
  /** Public origin without a trailing slash, or null when it is not configured. */
  origin: string | null;
  title: string;
  description: string | null;
  cancelled: boolean;
  organizationName: string | null;
  hasMainImage: boolean;
  schedules: readonly StructuredSchedule[];
  contributors: readonly StructuredContributor[];
  offers: readonly StructuredOffer[];
  /** The first external ticket or registration link, if any. */
  offerUrl: string | null;
  /** Present only for a Festival, whose dates come from its children (ADR-0009). */
  festivalChildren?: readonly StructuredFestivalChild[];
};

type JsonLd = Record<string, unknown>;

const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * An instant as ISO 8601 in Tokyo local time with its offset. Japan observes no
 * daylight saving time, so the offset is fixed.
 */
export function tokyoIsoDateTime(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${new Date(parsed.getTime() + TOKYO_OFFSET_MS).toISOString().slice(0, 19)}+09:00`;
}

function scheduleDates(schedule: Pick<StructuredSchedule, "startsAt" | "endsAt" | "allDay">) {
  const format = schedule.allDay ? tokyoDateKey : tokyoIsoDateTime;
  const startDate = format(schedule.startsAt);
  const endDate = schedule.endsAt ? format(schedule.endsAt) : null;
  return { startDate, endDate };
}

/** A minor-unit amount as the decimal string schema.org expects, e.g. 250050 USD → "2500.50". */
export function minorUnitToDecimal(value: string | number, currency: string): string | null {
  const text = String(value);
  if (!/^\d+$/.test(text) || !/^[A-Z]{3}$/.test(currency)) return null;

  let digits: number;
  try {
    digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    return null;
  }
  if (digits === 0) return BigInt(text).toString();

  const padded = text.padStart(digits + 1, "0");
  return `${BigInt(padded.slice(0, -digits)).toString()}.${padded.slice(-digits)}`;
}

function absolute(origin: string | null, path: string) {
  return origin ? `${origin}${path}` : undefined;
}

function place(venue: StructuredVenue, origin: string | null): JsonLd {
  const street = [venue.addressLine1, venue.addressLine2]
    .map((line) => line?.trim())
    .filter(Boolean)
    .join(" ");

  return compact({
    "@type": "Place",
    name: venue.name,
    url: absolute(origin, `/venues/${venue.id}`),
    address: compact({
      "@type": "PostalAddress",
      streetAddress: street || undefined,
      addressRegion: prefectureName(venue.prefecture),
      addressCountry: "JP",
    }),
  });
}

/**
 * Credits are free-text roles (出演, 振付, 照明…), so they cannot tell a
 * performer from a member of staff. Every credited Artist is therefore a
 * `contributor`, which is true of all of them, rather than a `performer`,
 * which would be false of some.
 */
function contributor(artist: StructuredContributor, origin: string | null): JsonLd {
  const type = artist.artistType === "individual"
    ? "Person"
    : artist.artistType === "company" || artist.artistType === "collective"
      ? "PerformingGroup"
      : "Organization";
  return compact({
    "@type": type,
    name: artist.name,
    url: absolute(origin, `/artists/${artist.id}`),
  });
}

function offer(input: StructuredOffer, url: string | null): JsonLd | null {
  const { currency, priceType } = input;
  const name = input.label?.trim() || undefined;

  if ((priceType === "fixed" || priceType === "sliding_scale") && currency && input.amountMinor != null) {
    const price = minorUnitToDecimal(input.amountMinor, currency);
    return price ? compact({ "@type": "Offer", name, price, priceCurrency: currency, url: url ?? undefined }) : null;
  }

  if (priceType === "range" && currency && input.minAmountMinor != null && input.maxAmountMinor != null) {
    const minPrice = minorUnitToDecimal(input.minAmountMinor, currency);
    const maxPrice = minorUnitToDecimal(input.maxAmountMinor, currency);
    if (!minPrice || !maxPrice) return null;
    return compact({
      "@type": "Offer",
      name,
      priceCurrency: currency,
      priceSpecification: { "@type": "PriceSpecification", minPrice, maxPrice, priceCurrency: currency },
      url: url ?? undefined,
    });
  }

  if (priceType === "pay_what_you_can" && currency && input.minAmountMinor != null) {
    const minPrice = minorUnitToDecimal(input.minAmountMinor, currency);
    if (!minPrice) return null;
    return compact({
      "@type": "Offer",
      name,
      priceCurrency: currency,
      priceSpecification: { "@type": "PriceSpecification", minPrice, priceCurrency: currency },
      url: url ?? undefined,
    });
  }

  // Free, donation, dynamic and pass-included prices carry no amount to state.
  return null;
}

function compact<T extends JsonLd>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null),
  ) as T;
}

function sharedProperties(input: StructuredEventInput): JsonLd {
  const offers = input.offers
    .map((item) => offer(item, input.offerUrl))
    .filter((item): item is JsonLd => item !== null);
  const allFree = input.offers.length > 0 && input.offers.every((item) => item.priceType === "free");

  return compact({
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.title,
    description: input.description?.trim() || undefined,
    url: absolute(input.origin, `/events/${input.eventId}`),
    image: input.hasMainImage && input.origin
      ? [`${input.origin}/events/${input.eventId}/image`]
      : undefined,
    eventStatus: input.cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: input.organizationName
      ? { "@type": "Organization", name: input.organizationName }
      : undefined,
    contributor: input.contributors.length
      ? uniqueById(input.contributors).map((artist) => contributor(artist, input.origin))
      : undefined,
    offers: offers.length ? offers : undefined,
    isAccessibleForFree: allFree ? true : undefined,
  });
}

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function festivalEvent(input: StructuredEventInput, children: readonly StructuredFestivalChild[]): JsonLd | null {
  const schedules = children.flatMap((child) => child.schedules);
  if (!schedules.length) return null;

  const starts = schedules.map((schedule) => scheduleDates(schedule).startDate).filter(Boolean) as string[];
  const ends = schedules
    .map((schedule) => {
      const { startDate, endDate } = scheduleDates(schedule);
      return endDate ?? startDate;
    })
    .filter(Boolean) as string[];
  if (!starts.length) return null;

  const byInstant = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00+09:00` : value).getTime();
  const startDate = [...starts].sort((a, b) => byInstant(a) - byInstant(b))[0];
  const endDate = [...ends].sort((a, b) => byInstant(b) - byInstant(a))[0];
  const venues = uniqueById(
    schedules.map((schedule) => schedule.venue).filter((venue): venue is StructuredVenue => venue !== null),
  );

  const subEvent = children
    .map((child): JsonLd | null => {
      const first = [...child.schedules]
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
      const dates = first ? scheduleDates(first) : null;
      if (!dates?.startDate) return null;
      return compact({
        "@type": "Event",
        name: child.title,
        url: absolute(input.origin, `/events/${child.id}`),
        startDate: dates.startDate,
      });
    })
    .filter((item): item is JsonLd => item !== null);

  return compact({
    ...sharedProperties(input),
    startDate,
    endDate: endDate && endDate !== startDate ? endDate : undefined,
    location: venues.length === 1
      ? place(venues[0], input.origin)
      : venues.length
        ? venues.map((venue) => place(venue, input.origin))
        : undefined,
    subEvent: subEvent.length ? subEvent : undefined,
  });
}

export function buildEventStructuredData(input: StructuredEventInput): JsonLd[] {
  if (input.festivalChildren) {
    const festival = festivalEvent(input, input.festivalChildren);
    return festival ? [festival] : [];
  }

  // One Event per Schedule: a run of performances is several occurrences, each
  // with its own date and possibly its own Venue.
  const shared = sharedProperties(input);
  return input.schedules.flatMap((schedule) => {
    const { startDate, endDate } = scheduleDates(schedule);
    if (!startDate || !schedule.venue) return [];
    return [compact({
      ...shared,
      startDate,
      endDate: endDate ?? undefined,
      location: place(schedule.venue, input.origin),
    })];
  });
}
