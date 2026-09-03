import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { validateEnvironment } from "@/lib/env";
import type { SupabaseDatabase } from "@/lib/db/supabase.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { supabasePublishableKey, supabaseUrl } = validateEnvironment();

  const supabase = createServerClient<SupabaseDatabase>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
