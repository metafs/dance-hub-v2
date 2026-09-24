"use server";

import {
  requestEventCancellation as requestEventCancellationCommand,
  resubmitEventCancellation as resubmitEventCancellationCommand,
} from "@/features/events/commands";
import {
  createNextEventRevisionDraft as createNextEventRevisionDraftCommand,
} from "@/features/revisions/commands";

export async function createNextEventRevisionDraft(formData: FormData) {
  return createNextEventRevisionDraftCommand(formData);
}

export async function requestEventCancellation(formData: FormData) {
  return requestEventCancellationCommand(formData);
}

export async function resubmitEventCancellation(formData: FormData) {
  return resubmitEventCancellationCommand(formData);
}
