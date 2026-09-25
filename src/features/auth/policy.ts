import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requestPathHeader, safeRedirectPath } from "./redirect";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    // Return to the page that asked, so a link into the workspace or the
    // admin queues still lands there after signing in.
    const requested = safeRedirectPath((await headers()).get(requestPathHeader));
    redirect(`/login?next=${encodeURIComponent(requested)}`);
  }

  return { supabase, user: data.user };
}
