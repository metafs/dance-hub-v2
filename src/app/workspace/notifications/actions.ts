"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/policy";

export async function markReviewNotificationRead(formData: FormData) {
  const notificationId = Number(formData.get("notificationId"));
  if (!Number.isSafeInteger(notificationId) || notificationId <= 0) return;

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("review_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_user_id", user.id);

  if (error) throw new Error("通知を既読にできませんでした。");
  revalidatePath("/workspace", "layout");
}

export async function markAllReviewNotificationsRead() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("review_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) throw new Error("通知を既読にできませんでした。");
  revalidatePath("/workspace", "layout");
}
