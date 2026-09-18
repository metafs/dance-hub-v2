"use server";

import {
  requestEventCancellation as requestEventCancellationCommand,
  resubmitEventCancellation as resubmitEventCancellationCommand,
} from "@/features/events/commands";
import {
  createEventDraftWithState,
  createNextEventRevisionDraft as createNextEventRevisionDraftCommand,
  mutateEventDraftWithState,
  saveEventDraft as saveEventDraftCommand,
  submitEventDraft as submitEventDraftCommand,
} from "@/features/revisions/commands";
import type { EventRevisionActionState } from "@/lib/events/revision-action-state";

export async function createEventDraft(previousState: EventRevisionActionState, formData: FormData) {
  return createEventDraftWithState(previousState, formData);
}

export async function mutateEventDraft(previousState: EventRevisionActionState, formData: FormData) {
  return mutateEventDraftWithState(previousState, formData);
}

export async function saveEventDraft(formData: FormData) {
  return saveEventDraftCommand(formData);
}

export async function submitEventDraft(formData: FormData) {
  return submitEventDraftCommand(formData);
}

export async function createNextEventRevisionDraft(formData: FormData) {
  return createNextEventRevisionDraftCommand(formData);
}

export async function requestEventCancellation(formData: FormData) {
  return requestEventCancellationCommand(formData);
}

export async function resubmitEventCancellation(formData: FormData) {
  return resubmitEventCancellationCommand(formData);
}
