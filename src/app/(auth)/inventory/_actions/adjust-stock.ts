"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { adjustStockSchema, type AdjustStockFormValues } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function adjustStock(
  productId: string,
  data: AdjustStockFormValues
): Promise<void> {
  const parsed = adjustStockSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await requireRole(["admin", "editor"]);
  await enforceRateLimit("adjust-stock");

  const supabase = await createClient();

  const delta = parsed.data.mode === "entrada" ? parsed.data.qty : -parsed.data.qty;

  // RPC atômica: lock da linha, guarda contra estoque negativo, status pelos
  // thresholds configurados e insert do movimento em uma única transação.
  const { error } = await supabase.rpc("apply_stock_movement", {
    p_product_id: productId,
    p_delta: delta,
    p_type: "ajuste",
    p_reason: parsed.data.reason || null,
  });

  if (error) throw new Error(error.message);

  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
