"use client";

import { useActionState } from "react";

import { mutateEventDraft } from "@/app/workspace/[organizationId]/events/actions";
import { initialEventRevisionActionState } from "@/lib/events/revision-action-state";
import type { TicketOfferDraft } from "@/lib/events/ticket-offers";

import { EventFields } from "./event-fields";

type Props = {
  organizationId: string;
  eventId: string;
  revisionId: string;
  artists: { id: string; name: string }[];
  venues: { id: string; name: string; prefecture?: string }[];
  festivalParents: { id: string; title: string }[];
  ticketOffers: TicketOfferDraft[];
  defaults: Record<string, string | boolean | null | undefined>;
};

export function EventRevisionForm(props: Props) {
  const [state, action, pending] = useActionState(mutateEventDraft, initialEventRevisionActionState);

  return <form action={action} className="form-card form-stack" noValidate>
    <input name="organizationId" type="hidden" value={props.organizationId}/>
    <input name="eventId" type="hidden" value={props.eventId}/>
    <input name="revisionId" type="hidden" value={props.revisionId}/>
    {state.status === "error" ? <div className="notice notice-error" role="alert"><p>{state.message}</p>{state.fieldErrors.form?.map((message) => <p key={message}>{message}</p>)}</div> : null}
    <EventFields artists={props.artists} venues={props.venues} festivalParents={props.festivalParents} ticketOffers={props.ticketOffers} defaults={props.defaults} errors={state.fieldErrors}/>
    <div className="button-row">
      <button className="button button-secondary" disabled={pending} name="intent" value="save">下書きを保存</button>
      <button className="button button-primary" disabled={pending} name="intent" value="submit">審査へ提出</button>
    </div>
  </form>;
}
