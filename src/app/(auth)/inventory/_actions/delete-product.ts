"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function deleteProduct(productId: string): Promise<void> {
  await requireRole(["admin"]);
  await enforceRateLimit("delete-product");

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
  revalidateTag("products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
