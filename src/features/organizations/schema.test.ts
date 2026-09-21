import { describe, expect, it } from "vitest";

import {
  applicationStatusLabel,
  hasOrganizationCapability,
  organizationRoleLabel,
} from "./schema";

describe("Organization role matrix", () => {
  it("limits member management to owners", () => {
    expect(hasOrganizationCapability("owner", "manageMembers")).toBe(true);
    expect(hasOrganizationCapability("admin", "manageMembers")).toBe(false);
    expect(hasOrganizationCapability("editor", "manageMembers")).toBe(false);
  });

  it("allows owners and admins to edit organization details and request cancellation", () => {
    expect(hasOrganizationCapability("owner", "editOrganization")).toBe(true);
    expect(hasOrganizationCapability("admin", "editOrganization")).toBe(true);
    expect(hasOrganizationCapability("editor", "editOrganization")).toBe(false);
    expect(hasOrganizationCapability("admin", "requestCancellation")).toBe(true);
    expect(hasOrganizationCapability("editor", "requestCancellation")).toBe(false);
  });

  it("allows every organization role to edit events and create candidates", () => {
    for (const role of ["owner", "admin", "editor"] as const) {
      expect(hasOrganizationCapability(role, "editEvents")).toBe(true);
      expect(hasOrganizationCapability(role, "createCandidates")).toBe(true);
    }
  });

  it("names roles and application states in Japanese for the workspace", () => {
    expect(organizationRoleLabel("owner")).toBe("オーナー");
    expect(organizationRoleLabel("editor")).toBe("編集者");
    expect(applicationStatusLabel("submitted")).toBe("審査中");
    expect(applicationStatusLabel("unknown")).toBe("unknown");
  });
});
