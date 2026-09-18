import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/policy";
import {
  hasOrganizationCapability,
  isOrganizationRole,
  type OrganizationCapability,
  type OrganizationRole,
} from "@/features/organizations/schema";

export async function requireOrganizationMembership(organizationId: string) {
  const context = await requireUser();
  const { data, error } = await context.supabase
    .from("organization_memberships")
    .select("organization_id, role, organizations(id, name, website_url)")
    .eq("organization_id", organizationId)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (error || !data || !isOrganizationRole(data.role)) {
    redirect("/workspace?error=organization-access-denied");
  }

  const organizationValue = data.organizations;
  const organization = Array.isArray(organizationValue)
    ? organizationValue[0]
    : organizationValue;

  if (!organization) {
    redirect("/workspace?error=organization-access-denied");
  }

  return {
    ...context,
    organization,
    role: data.role as OrganizationRole,
  };
}

export async function requireOrganizationCapability(
  organizationId: string,
  capability: OrganizationCapability,
) {
  const context = await requireOrganizationMembership(organizationId);

  if (!hasOrganizationCapability(context.role, capability)) {
    redirect(`/workspace/${organizationId}?error=insufficient-role`);
  }

  return context;
}
