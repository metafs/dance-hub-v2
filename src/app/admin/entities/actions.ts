"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { formText } from "@/lib/forms/input";

export async function reviewCandidate(formData: FormData) {
  const kind = formText(formData, "kind");
  const action = formText(formData, "action");
  const candidateId = formText(formData, "candidateId");
  const reason = formText(formData, "reason");
  const survivorId = formText(formData, "survivorId");
  if (!candidateId || !reason || !["artist", "venue"].includes(kind)) redirect("/admin/entities?error=invalid-review");
  const { supabase } = await requirePlatformAdmin();
  const { error } = kind === "artist"
    ? action === "activate"
      ? await supabase.rpc("activate_artist_candidate", { candidate_id: candidateId, reason })
      : action === "reject"
        ? await supabase.rpc("reject_artist_candidate", { candidate_id: candidateId, reason })
        : await supabase.rpc("merge_artist_candidate", { candidate_id: candidateId, survivor_artist_id: survivorId, reason })
    : action === "activate"
      ? await supabase.rpc("activate_venue_candidate", { candidate_id: candidateId, reason })
      : action === "reject"
        ? await supabase.rpc("reject_venue_candidate", { candidate_id: candidateId, reason })
        : await supabase.rpc("merge_venue_candidate", { candidate_id: candidateId, survivor_venue_id: survivorId, reason });
  if (error) redirect("/admin/entities?error=review-failed");
  revalidatePath("/admin/entities");
  redirect("/admin/entities?reviewed=1");
}
