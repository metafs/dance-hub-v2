import type { TicketOfferDraft } from "./schema";

export type EventRevisionField =
  | "title" | "description" | "eventType" | "applicationDeadline"
  | "artistId" | "artistRole" | "venueId" | "startsAt" | "endsAt" | "ticketOffers"
  | "ticketUrl" | "ticketLabel" | "externalUrl" | "externalLabel"
  | "contactKind" | "contactValue"
  | "image" | "imageAlt" | "form";

export type EventRevisionFieldErrors = Partial<Record<EventRevisionField, string[]>>;

export type EventRevisionFormValues = {
  organizationId: string;
  eventId: string;
  revisionId: string;
  title: string;
  description: string;
  eventType: string;
  applicationDeadline: string;
  proposedParentEventId: string;
  noRegistrationRequired: boolean;
  contactKind: string;
  contactValue: string;
  artistId: string;
  artistRole: string;
  venueId: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  ticketKind: "ticket" | "registration";
  ticketUrl: string;
  ticketLabel: string;
  externalUrl: string;
  externalLabel: string;
  imageAlt: string;
  ticketOffers: TicketOfferDraft[];
};

export function eventRevisionFieldDefaults(values: EventRevisionFormValues) {
  return {
    organizationId: values.organizationId,
    eventId: values.eventId,
    revisionId: values.revisionId,
    title: values.title,
    description: values.description,
    eventType: values.eventType,
    applicationDeadline: values.applicationDeadline,
    proposedParentEventId: values.proposedParentEventId,
    noRegistrationRequired: values.noRegistrationRequired,
    contactKind: values.contactKind,
    contactValue: values.contactValue,
    artistId: values.artistId,
    artistRole: values.artistRole,
    venueId: values.venueId,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    allDay: values.allDay,
    ticketKind: values.ticketKind,
    ticketUrl: values.ticketUrl,
    ticketLabel: values.ticketLabel,
    externalUrl: values.externalUrl,
    externalLabel: values.externalLabel,
    imageAlt: values.imageAlt,
  } satisfies Record<string, string | boolean | null | undefined>;
}

export type EventRevisionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors: EventRevisionFieldErrors;
  values?: EventRevisionFormValues;
};

export const initialEventRevisionActionState: EventRevisionActionState = { status: "idle", fieldErrors: {} };
