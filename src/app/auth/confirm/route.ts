import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { confirmEmailLink } from "@/features/auth/confirm";

export const dynamic = "force-dynamic";

/** Every link in an account email lands here (ADR-0025, supabase/templates/). */
export async function GET(request: NextRequest) {
  redirect(await confirmEmailLink(request.nextUrl.searchParams));
}
