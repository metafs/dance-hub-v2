"use client";

import { useActionState, useRef } from "react";

import { mutateEventDraftWithState } from "@/features/revisions/commands";
import { eventRevisionFieldDefaults, initialEventRevisionActionState } from "@/lib/events/revision-action-state";
import type { TicketOfferDraft } from "@/lib/events/ticket-offers";
import { useFocusFirstError } from "@/ui/use-focus-first-error";

import { EventFields } from "./event-fields";

type Props = {
  organizationId: string;
  eventId: string;
  revisionId: string;
  artists: { id: string; name: string }[];
  venues: { id: string; name: string; prefecture?: string }[];
  festivalParents: { id: string; title: string }[];
  ticketOffers: TicketOfferDraft[];
  hasMainImage: boolean;
  defaults: Record<string, string | boolean | null | undefined>;
};

export function EventRevisionForm(props: Props) {
  const [state, action, pending] = useActionState(mutateEventDraftWithState, initialEventRevisionActionState);
  const defaults = state.values ? eventRevisionFieldDefaults(state.values) : props.defaults;

  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.status === "error", state);

  return <form action={action} className="form-panel" noValidate ref={formRef}>
    <input name="organizationId" type="hidden" value={props.organizationId}/>
    <input name="eventId" type="hidden" value={props.eventId}/>
    <input name="revisionId" type="hidden" value={props.revisionId}/>
    {state.status === "error" ? <div className="notice notice-error" data-error-summary role="alert" tabIndex={-1}><p>{state.message}</p>{state.fieldErrors.form?.map((message) => <p key={message}>{message}</p>)}</div> : null}
    <EventFields key={state.values ? JSON.stringify(state.values) : "initial"} artists={props.artists} venues={props.venues} festivalParents={props.festivalParents} ticketOffers={state.values?.ticketOffers ?? props.ticketOffers} canUploadMainImage hasMainImage={props.hasMainImage} defaults={defaults} errors={state.fieldErrors}/>
    <div className="form-actions">
      <p>審査へ提出すると、結果が出るまでこの版は編集できません。公開中の内容はそのまま表示され続けます。</p>
      <div className="button-row">
        <button className="button" disabled={pending} name="intent" value="save">下書きを保存</button>
        <button className="button button-primary" disabled={pending} name="intent" value="submit">審査へ提出</button>
      </div>
    </div>
  </form>;
}
