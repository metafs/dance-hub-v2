import "server-only";

import type { requireOrganizationCapability } from "@/features/organizations/policy";

type OrganizationContext = Awaited<
  ReturnType<typeof requireOrganizationCapability>
>;

export function getEntityWorkspaceData(
  supabase: OrganizationContext["supabase"],
  organizationId: string,
) {
  return Promise.all([
    supabase
      .from("artists")
      .select("id, name, artist_type, website_url")
      .order("name")
      .limit(30),
    supabase
      .from("venues")
      .select("id, name, prefecture, address_line1")
      .order("name")
      .limit(30),
    supabase
      .from("artist_candidates")
      .select("id, name, artist_type, status, decision_reason")
      .eq("creator_organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("venue_candidates")
      .select("id, name, prefecture, status, decision_reason")
      .eq("creator_organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);
}

export function getPendingArtistCandidate(
  supabase: OrganizationContext["supabase"],
  organizationId: string,
  candidateId: string,
) {
  return supabase
    .from("artist_candidates")
    .select("id, name, artist_type, profile, website_url, status")
    .eq("id", candidateId)
    .eq("creator_organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();
}

export function getPendingVenueCandidate(
  supabase: OrganizationContext["supabase"],
  organizationId: string,
  candidateId: string,
) {
  return supabase
    .from("venue_candidates")
    .select(
      "id, name, prefecture, address_line1, address_line2, website_url, status",
    )
    .eq("id", candidateId)
    .eq("creator_organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();
}
