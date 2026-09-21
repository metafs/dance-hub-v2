"use server";

import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/policy";

function normalizedWebsite(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function submitOrganizationApplication(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const websiteInput = String(formData.get("websiteUrl") ?? "").trim();
  const websiteUrl = normalizedWebsite(websiteInput);
  const responsibleParty = String(formData.get("responsibleParty") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const activityUrl = normalizedWebsite(String(formData.get("activityUrl") ?? "").trim());

  if (!name || name.length > 160) {
    redirect("/workspace/apply?error=invalid-name");
  }

  if (websiteInput && !websiteUrl) {
    redirect("/workspace/apply?error=invalid-website");
  }
  if (!responsibleParty || responsibleParty.length > 200 || !contact || contact.length > 500) {
    redirect("/workspace/apply?error=invalid-evidence");
  }
  if (!activityUrl) redirect("/workspace/apply?error=invalid-activity");

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("organization_applications").insert({
    applicant_id: user.id,
    name,
    website_url: websiteUrl,
    responsible_party: responsibleParty,
    contact,
    activity_url: activityUrl,
  });

  if (error) {
    const reason = error.code === "23505" ? "already-submitted" : "submission-failed";
    redirect(`/workspace/apply?error=${reason}`);
  }

  redirect("/workspace?submitted=1");
}
