"use server";

import { submitOrganizationApplication as submitOrganizationApplicationCommand } from "@/features/organizations/commands";

export async function submitOrganizationApplication(formData: FormData) {
  return submitOrganizationApplicationCommand(formData);
}
