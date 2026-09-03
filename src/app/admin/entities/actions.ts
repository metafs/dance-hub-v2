"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/authorization";

export async function reviewCandidate(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const action = String(formData.get("action") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const survivorId = String(formData.get("survivorId") ?? "");
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
