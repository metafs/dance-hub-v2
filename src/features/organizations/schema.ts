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
