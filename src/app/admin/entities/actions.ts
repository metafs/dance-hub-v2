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
  const rpc = action === "activate" ? `activate_${kind}_candidate` : action === "reject" ? `reject_${kind}_candidate` : `merge_${kind}_candidate`;
  const args = action === "merge" ? { candidate_id: candidateId, [`survivor_${kind}_id`]: survivorId, reason } : { candidate_id: candidateId, reason };
  const { error } = await supabase.rpc(rpc, args);
  if (error) redirect("/admin/entities?error=review-failed");
  revalidatePath("/admin/entities");
  redirect("/admin/entities?reviewed=1");
}
