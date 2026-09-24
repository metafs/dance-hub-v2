import "server-only";

import type { requireUser } from "@/features/auth/policy";

type UserContext = Awaited<ReturnType<typeof requireUser>>;

export function listReviewNotifications(
  supabase: UserContext["supabase"],
  userId: string,
) {
  return supabase
    .from("review_notifications")
    .select("id, kind, subject, decision_reason, event_id, read_at, created_at")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
}

export function countUnreadReviewNotifications(
  supabase: UserContext["supabase"],
  userId: string,
) {
  return supabase
    .from("review_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("read_at", null);
}
