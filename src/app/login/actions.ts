"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formRawText, formText } from "@/lib/forms/input";

function safeNextPath(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.includes("\\") && !value.startsWith("//")
    ? value
    : "/workspace";
}

export async function login(formData: FormData) {
  const email = formText(formData, "email");
  const password = formRawText(formData, "password");
  const nextPath = safeNextPath(formData.get("next"));

  if (!email || !password) {
    redirect(`/login?error=missing-credentials&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=invalid-credentials&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
