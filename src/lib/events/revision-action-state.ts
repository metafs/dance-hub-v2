export type EventRevisionField =
  | "title" | "description" | "eventType" | "applicationDeadline"
  | "artistId" | "artistRole" | "venueId" | "startsAt" | "endsAt" | "ticketOffers"
  | "ticketUrl" | "ticketLabel" | "externalUrl" | "externalLabel"
  | "imageObjectKey" | "imageContentType" | "imageAlt" | "form";

export type EventRevisionFieldErrors = Partial<Record<EventRevisionField, string[]>>;

export type EventRevisionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors: EventRevisionFieldErrors;
};

export const initialEventRevisionActionState: EventRevisionActionState = { status: "idle", fieldErrors: {} };
