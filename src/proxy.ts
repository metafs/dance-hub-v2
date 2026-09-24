import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { requestPathHeader } from "@/features/auth/redirect";
import type { SupabaseDatabase } from "@/lib/db/supabase.types";

/**
 * Runs before every page and route handler. It lives in src/ because the app
 * does: Next.js looks for the proxy next to the app directory and ignored it
 * at the repository root, so neither step below used to run.
 */
export async function proxy(request: NextRequest) {
  // A server component cannot read the URL it renders, and requireUser needs
  // it to send a signed-out user back after signing in. Set here, it replaces
  // anything a client sent under the same name.
  request.headers.set(requestPathHeader, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient<SupabaseDatabase>(url, publishableKey, {
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
