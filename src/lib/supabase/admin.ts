import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { SupabaseDatabase } from "@/lib/db/supabase.types";

/**
 * The service-role client. Used only for the two approved cases: enqueueing an
 * anonymous listing request after server-side bot verification, and sending an
 * Organizer invitation after the caller is checked to be a Platform Admin
 * (ADR-0025). This key must never cross the server boundary.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient<SupabaseDatabase>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
