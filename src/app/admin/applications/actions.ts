"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/authorization";

function reviewValues(formData: FormData) {
  return {
    applicationId: String(formData.get("applicationId") ?? ""),
    reason: String(formData.get("reason") ?? "").trim(),
  };
}

export async function approveApplication(formData: FormData) {
  const { applicationId, reason } = reviewValues(formData);
  if (!applicationId) redirect("/admin/applications?error=invalid-application");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("approve_organization_application", {
    application_id: applicationId,
    decision_reason: reason || null,
  });

  if (error) redirect("/admin/applications?error=review-failed");
  revalidatePath("/admin/applications");
  redirect("/admin/applications?reviewed=approved");
}

export async function rejectApplication(formData: FormData) {
  const { applicationId, reason } = reviewValues(formData);
  if (!applicationId || !reason) redirect("/admin/applications?error=rejection-reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("reject_organization_application", {
    application_id: applicationId,
    decision_reason: reason,
  });

  if (error) redirect("/admin/applications?error=review-failed");
  revalidatePath("/admin/applications");
  redirect("/admin/applications?reviewed=rejected");
}
