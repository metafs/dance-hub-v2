import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { SupabaseDatabase } from "@/lib/db/supabase.types";

/**
 * Used only after server-side bot verification to enqueue anonymous requests.
 * This key must never cross the server boundary.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Anonymous request intake is not configured.");
  return createClient<SupabaseDatabase>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
