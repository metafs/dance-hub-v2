"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/authorization";

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

  if (!name || name.length > 160) {
    redirect("/workspace/apply?error=invalid-name");
  }

  if (websiteInput && !websiteUrl) {
    redirect("/workspace/apply?error=invalid-website");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("organization_applications").insert({
    applicant_id: user.id,
    name,
    website_url: websiteUrl,
  });

  if (error) {
    const reason = error.code === "23505" ? "already-submitted" : "submission-failed";
    redirect(`/workspace/apply?error=${reason}`);
  }

  redirect("/workspace?submitted=1");
}
