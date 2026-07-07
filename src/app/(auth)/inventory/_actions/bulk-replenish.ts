"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function bulkReplenish(): Promise<void> {
  await requireRole(["admin", "editor"]);
  await enforceRateLimit("bulk-replenish");

  const supabase = await createClient();

  // RPC set-based: repõe cada produto com estoque <= stock_low ao seu próprio
  // max_stock, com lock por linha e movimentos registrados na mesma transação.
  const { error } = await supabase.rpc("replenish_all_low");
  if (error) throw new Error(error.message);

  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
