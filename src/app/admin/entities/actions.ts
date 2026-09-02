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
  const rpc = action === "activate" ? `activate_${kind}_candidate` : action === "reject" ? `reject_${kind}_candidate` : `merge_${kind}_candidate`;
  const args = action === "merge" ? { candidate_id: candidateId, [`survivor_${kind}_id`]: survivorId, reason } : { candidate_id: candidateId, reason };
  const { error } = await supabase.rpc(rpc, args);
  if (error) redirect("/admin/entities?error=review-failed");
  revalidatePath("/admin/entities");
  redirect("/admin/entities?reviewed=1");
}
