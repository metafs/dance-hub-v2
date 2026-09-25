"use server";

import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireUser } from "./policy";
import { safeRedirectPath } from "./redirect";
import { normalizeEmail, passwordProblem } from "./schema";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeRedirectPath(formData.get("next"));

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

/**
 * Sends a password reset link (ADR-0025). The page says the same thing whether
 * or not the address has an account, so the form cannot be used to find out.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  if (!email) redirect("/password/forgot?error=invalid-email");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  // A rate limit is answered like a success; a failing mailer is not, so it
  // reaches the error log instead of leaving the person waiting for nothing.
  if (error && (error.status ?? 500) >= 500) throw new Error("Password reset email could not be sent.");

  redirect("/password/forgot?sent=1");
}

/**
 * Sets the signed-in user's password: after accepting an invitation, after
 * following a reset link, or to change it.
 */
export async function setPassword(formData: FormData) {
  const welcome = formData.get("welcome") === "1" ? "&welcome=1" : "";
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  const problem = passwordProblem(password, confirmation);
  if (problem) redirect(`/account/password?error=${problem}${welcome}`);

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const code = error.code === "same_password" ? "same-password" : error.code === "weak_password" ? "weak-password" : "update-failed";
    redirect(`/account/password?error=${code}${welcome}`);
  }

  redirect("/workspace?passwordSet=1");
}
