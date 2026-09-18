import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { validateEnvironment } from "@/lib/env";
import type { SupabaseDatabase } from "@/lib/db/supabase.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabasePublishableKey, supabaseUrl } = validateEnvironment();

  return createServerClient<SupabaseDatabase>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write response cookies. The proxy refreshes
          // sessions before rendering; Server Actions and Route Handlers can write.
        }
      },
    },
  });
}
