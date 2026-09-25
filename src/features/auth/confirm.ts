import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where each kind of email link leads once verified (ADR-0025). The link
 * carries only the token and its kind; the destination is decided here, so a
 * link cannot be made to send anyone elsewhere.
 */
const destinations = {
  invite: "/account/password?welcome=1",
  recovery: "/account/password",
} as const;

type LinkType = keyof typeof destinations;

function isLinkType(value: string | null): value is LinkType {
  return value !== null && Object.hasOwn(destinations, value);
}

/**
 * Verifies the token in an invitation or password reset link and signs the
 * person in. Returns the path to continue to.
 */
export async function confirmEmailLink(params: URLSearchParams): Promise<string> {
  const type = params.get("type");
  const tokenHash = params.get("token_hash");
  if (!tokenHash || !isLinkType(type)) return "/login?error=link-invalid";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  return error ? "/login?error=link-invalid" : destinations[type];
}
