"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateUserRoleSchema, type UpdateUserRoleValues } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function updateUserRole(input: UpdateUserRoleValues): Promise<void> {
  const parsed = updateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await requireRole(["admin"]);
  await enforceRateLimit("update-user-role");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.userId);

  if (error) throw error;

  revalidatePath("/settings", "layout");
}
