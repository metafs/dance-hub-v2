import type { Database } from "@/lib/database.types";

export const organizationRoles = ["owner", "admin", "editor"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];

export type OrganizationCapability =
  | "editOrganization"
  | "manageMembers"
  | "editEvents"
  | "requestCancellation"
  | "createCandidates";

const capabilityRoles: Record<OrganizationCapability, readonly OrganizationRole[]> = {
  createCandidates: organizationRoles,
  editEvents: organizationRoles,
  editOrganization: ["owner", "admin"],
  manageMembers: ["owner"],
  requestCancellation: ["owner", "admin"],
};

export function hasOrganizationCapability(
  role: OrganizationRole,
  capability: OrganizationCapability,
) {
  return capabilityRoles[capability].includes(role);
}

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return organizationRoles.includes(value as OrganizationRole);
}

const roleLabels: Record<OrganizationRole, string> = {
  owner: "オーナー",
  admin: "管理者",
  editor: "編集者",
};

export function organizationRoleLabel(role: OrganizationRole): string {
  return roleLabels[role];
}

export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: "審査中",
  approved: "承認",
  rejected: "却下",
};

export function applicationStatusLabel(status: string): string {
  return applicationStatusLabels[status as ApplicationStatus] ?? status;
}
