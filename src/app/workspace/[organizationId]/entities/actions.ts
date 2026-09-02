"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/lib/auth/authorization";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function website(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function createArtistCandidate(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  const artistType = text(formData, "artistType");
  const profile = text(formData, "profile") || null;
  const websiteUrl = website(text(formData, "websiteUrl"));
  if (!organizationId || !name || !artistType) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("artist_candidates").insert({
    creator_organization_id: organizationId, name, artist_type: artistType,
    profile, website_url: websiteUrl,
  });
  if (error) redirect(`/workspace/${organizationId}/entities?error=artist-create`);
  revalidatePath(`/workspace/${organizationId}/entities`);
  redirect(`/workspace/${organizationId}/entities?created=artist`);
}

export async function createVenueCandidate(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const name = text(formData, "name");
  const prefecture = text(formData, "prefecture");
  const addressLine1 = text(formData, "addressLine1");
  const websiteUrl = website(text(formData, "websiteUrl"));
  if (!organizationId || !name || !prefecture || !addressLine1) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("venue_candidates").insert({
    creator_organization_id: organizationId, name, prefecture, address_line1: addressLine1,
    address_line2: text(formData, "addressLine2") || null, website_url: websiteUrl,
  });
  if (error) redirect(`/workspace/${organizationId}/entities?error=venue-create`);
  revalidatePath(`/workspace/${organizationId}/entities`);
  redirect(`/workspace/${organizationId}/entities?created=venue`);
}

export async function requestArtistChange(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const artistId = text(formData, "artistId");
  const name = text(formData, "name");
  const artistType = text(formData, "artistType");
  if (!organizationId || !artistId || !name || !artistType) redirect("/workspace");
  const { supabase, user } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("artist_change_requests").insert({
    artist_id: artistId, creator_organization_id: organizationId, submitted_by: user.id,
    proposed_name: name, proposed_artist_type: artistType,
    proposed_profile: text(formData, "profile") || null,
    proposed_website_url: website(text(formData, "websiteUrl")),
  });
  if (error) redirect(`/workspace/${organizationId}/entities?error=change-request`);
  redirect(`/workspace/${organizationId}/entities?created=change-request`);
}

export async function updateArtistCandidate(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const candidateId = text(formData, "candidateId");
  if (!organizationId || !candidateId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("artist_candidates").update({
    name: text(formData, "name"), artist_type: text(formData, "artistType"),
    profile: text(formData, "profile") || null, website_url: website(text(formData, "websiteUrl")),
  }).eq("id", candidateId).eq("creator_organization_id", organizationId).eq("status", "pending");
  if (error) redirect(`/workspace/${organizationId}/entities?error=artist-update`);
  redirect(`/workspace/${organizationId}/entities?updated=1`);
}

export async function updateVenueCandidate(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const candidateId = text(formData, "candidateId");
  if (!organizationId || !candidateId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("venue_candidates").update({
    name: text(formData, "name"), prefecture: text(formData, "prefecture"),
    address_line1: text(formData, "addressLine1"), address_line2: text(formData, "addressLine2") || null,
    website_url: website(text(formData, "websiteUrl")),
  }).eq("id", candidateId).eq("creator_organization_id", organizationId).eq("status", "pending");
  if (error) redirect(`/workspace/${organizationId}/entities?error=venue-update`);
  redirect(`/workspace/${organizationId}/entities?updated=1`);
}
