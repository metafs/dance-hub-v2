import "server-only";

import type { requireUser } from "@/features/auth/policy";

type UserContext = Awaited<ReturnType<typeof requireUser>>;

export function getWorkspaceIndexData(
  supabase: UserContext["supabase"],
  userId: string,
) {
  return Promise.all([
    supabase
      .from("organization_memberships")
      .select("organization_id, role, organizations(id, name)")
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("organization_applications")
      .select("id, name, status, decision_reason, created_at")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false }),
    supabase.rpc("is_platform_admin", { check_user: userId }),
  ]);
}

export function getUserOrganizationMemberships(
  supabase: UserContext["supabase"],
  userId: string,
) {
  return supabase
    .from("organization_memberships")
    .select("organization_id, role, organizations(id, name)")
    .eq("user_id", userId)
    .order("created_at");
}
