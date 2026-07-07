"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function deleteClient(clientId: string): Promise<void> {
  await requireRole(["admin"]);
  await enforceRateLimit("delete-client");

  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
  revalidateTag("clients");
  revalidatePath("/customers");
}
