"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/lib/auth/authorization";
import { formText, httpUrl } from "@/lib/forms/input";

export async function createArtistCandidate(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const name = formText(formData, "name");
  const artistType = formText(formData, "artistType");
  const profile = formText(formData, "profile") || null;
  const websiteUrl = httpUrl(formText(formData, "websiteUrl"));
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
  const organizationId = formText(formData, "organizationId");
  const name = formText(formData, "name");
  const prefecture = formText(formData, "prefecture");
  const addressLine1 = formText(formData, "addressLine1");
  const websiteUrl = httpUrl(formText(formData, "websiteUrl"));
  if (!organizationId || !name || !prefecture || !addressLine1) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("venue_candidates").insert({
    creator_organization_id: organizationId, name, prefecture, address_line1: addressLine1,
    address_line2: formText(formData, "addressLine2") || null, website_url: websiteUrl,
  });
  if (error) redirect(`/workspace/${organizationId}/entities?error=venue-create`);
  revalidatePath(`/workspace/${organizationId}/entities`);
  redirect(`/workspace/${organizationId}/entities?created=venue`);
}

export async function requestArtistChange(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const artistId = formText(formData, "artistId");
  const name = formText(formData, "name");
  const artistType = formText(formData, "artistType");
  if (!organizationId || !artistId || !name || !artistType) redirect("/workspace");
  const { supabase, user } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("artist_change_requests").insert({
    artist_id: artistId, creator_organization_id: organizationId, submitted_by: user.id,
    proposed_name: name, proposed_artist_type: artistType,
    proposed_profile: formText(formData, "profile") || null,
    proposed_website_url: httpUrl(formText(formData, "websiteUrl")),
  });
  if (error) redirect(`/workspace/${organizationId}/entities?error=change-request`);
  redirect(`/workspace/${organizationId}/entities?created=change-request`);
}

export async function updateArtistCandidate(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const candidateId = formText(formData, "candidateId");
  if (!organizationId || !candidateId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("artist_candidates").update({
    name: formText(formData, "name"), artist_type: formText(formData, "artistType"),
    profile: formText(formData, "profile") || null, website_url: httpUrl(formText(formData, "websiteUrl")),
  }).eq("id", candidateId).eq("creator_organization_id", organizationId).eq("status", "pending");
  if (error) redirect(`/workspace/${organizationId}/entities?error=artist-update`);
  redirect(`/workspace/${organizationId}/entities?updated=1`);
}

export async function updateVenueCandidate(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const candidateId = formText(formData, "candidateId");
  if (!organizationId || !candidateId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const { error } = await supabase.from("venue_candidates").update({
    name: formText(formData, "name"), prefecture: formText(formData, "prefecture"),
    address_line1: formText(formData, "addressLine1"), address_line2: formText(formData, "addressLine2") || null,
    website_url: httpUrl(formText(formData, "websiteUrl")),
  }).eq("id", candidateId).eq("creator_organization_id", organizationId).eq("status", "pending");
  if (error) redirect(`/workspace/${organizationId}/entities?error=venue-update`);
  redirect(`/workspace/${organizationId}/entities?updated=1`);
}
