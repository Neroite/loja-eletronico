"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function refundSale(saleId: string): Promise<void> {
  await requireRole(["admin", "editor"]);
  await enforceRateLimit("refund-sale");

  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .single();

  if (!sale || sale.status === "Cancelado") return;

  const { error: updateError } = await supabase
    .from("sales")
    .update({ status: "Cancelado" })
    .eq("id", saleId);
  if (updateError) throw updateError;

  // Produtos podem ter sido excluídos depois da venda — estorna só os que ainda
  // existem (comportamento anterior: itens sem produto eram ignorados).
  const { data: existingProducts } = await supabase
    .from("products")
    .select("id")
    .in("id", sale.items.map((i) => i.productId));
  const existingIds = new Set((existingProducts ?? []).map((p) => p.id));

  // Devolução ao estoque via RPC atômica. Sale items are unique per productId
  // (NewSaleModal merges quantities), so each item touches a different product
  // row — safe to process concurrently.
  const results = await Promise.all(
    sale.items
      .filter((item) => existingIds.has(item.productId))
      .map((item) =>
        supabase.rpc("apply_stock_movement", {
          p_product_id: item.productId,
          p_delta: item.quantity,
          p_type: "estorno",
          p_reason: `Estorno da venda ${saleId}`,
        })
      )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidateTag("sales");
  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
