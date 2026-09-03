"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/authorization";
import { formText, httpUrl } from "@/lib/forms/input";

export async function submitOrganizationApplication(formData: FormData) {
  const name = formText(formData, "name");
  const websiteInput = formText(formData, "websiteUrl");
  const websiteUrl = httpUrl(websiteInput);

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
