"use client";

import { useActionState, useRef } from "react";

import { createEventDraft } from "@/app/workspace/[organizationId]/events/actions";
import { eventRevisionFieldDefaults, initialEventRevisionActionState } from "@/lib/events/revision-action-state";
import { useFocusFirstError } from "@/ui/use-focus-first-error";

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

  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.status === "error", state);

  return <form action={action} className="form-panel" noValidate ref={formRef}>
    <input name="organizationId" type="hidden" value={props.organizationId}/>
    <h2>新しいEventを作成</h2>
    {state.status === "error" ? <div className="notice notice-error" data-error-summary role="alert" tabIndex={-1}><p>{state.message}</p>{state.fieldErrors.form?.map((message) => <p key={message}>{message}</p>)}</div> : null}
    <EventFields key={state.values ? JSON.stringify(state.values) : "initial"} artists={props.artists} venues={props.venues} festivalParents={props.festivalParents} ticketOffers={state.values?.ticketOffers} canUploadMainImage={false} defaults={defaults} errors={state.fieldErrors}/>
    <div className="form-actions">
      <p>下書きは運営からは見えません。</p>
      <button className="button button-primary" disabled={pending}>下書きを作成</button>
    </div>
  </form>;
}
