import "server-only";

import type { requireOrganizationCapability } from "@/lib/auth/authorization";

import type { EventRevisionInput } from "./revision-input";

type SupabaseClient = Awaited<ReturnType<typeof requireOrganizationCapability>>["supabase"];

export async function replaceEventRevisionContent(
  supabase: SupabaseClient,
  revisionId: string,
  values: EventRevisionInput["content"],
) {
  const { error } = await supabase.rpc("replace_event_revision_content", {
    target_revision_id: revisionId,
    revision_content: values,
  });
  return error;
}
