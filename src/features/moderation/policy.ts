import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/policy";

export async function requirePlatformAdmin() {
  const context = await requireUser();
  const { data, error } = await context.supabase.rpc("is_platform_admin", {
    check_user: context.user.id,
  });

  if (error || data !== true) {
    redirect("/workspace?error=platform-admin-required");
  }

  return context;
}
