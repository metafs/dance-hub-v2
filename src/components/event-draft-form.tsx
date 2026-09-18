"use client";

import { useActionState } from "react";

import { createEventDraft } from "@/app/workspace/[organizationId]/events/actions";
import { eventRevisionFieldDefaults, initialEventRevisionActionState } from "@/lib/events/revision-action-state";

import { EventFields } from "./event-fields";

type Props = {
  organizationId: string;
  artists: { id: string; name: string }[];
  venues: { id: string; name: string; prefecture?: string }[];
  festivalParents: { id: string; title: string }[];
};

export function EventDraftForm(props: Props) {
  const [state, action, pending] = useActionState(createEventDraft, initialEventRevisionActionState);
  const defaults = state.values ? eventRevisionFieldDefaults(state.values) : undefined;

  return <form action={action} className="form-card form-stack" noValidate>
    <input name="organizationId" type="hidden" value={props.organizationId}/>
    <h2>新しいEventを作成</h2>
    {state.status === "error" ? <div className="notice notice-error" role="alert"><p>{state.message}</p>{state.fieldErrors.form?.map((message) => <p key={message}>{message}</p>)}</div> : null}
    <EventFields key={state.values ? JSON.stringify(state.values) : "initial"} artists={props.artists} venues={props.venues} festivalParents={props.festivalParents} ticketOffers={state.values?.ticketOffers} defaults={defaults} errors={state.fieldErrors}/>
    <button className="button button-primary" disabled={pending}>下書きを作成</button>
  </form>;
}
