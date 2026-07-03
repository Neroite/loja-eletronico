"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { makeId } from "@/lib/id";
import { deriveStatus } from "@/lib/stock";

export async function refundSale(saleId: string): Promise<void> {
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .single();

  if (!sale || sale.status === "Cancelado") return;

  const now = new Date().toISOString();
  const [, { data: existingMovements }] = await Promise.all([
    supabase.from("sales").update({ status: "Cancelado" }).eq("id", saleId),
    supabase.from("stock_movements").select("id"),
  ]);

  // Sale items are unique per productId (NewSaleModal merges quantities), so each
  // item touches a different product row — safe to process concurrently.
  const movIds = (existingMovements ?? []).map((m) => m.id);
  await Promise.all(
    sale.items.map(async (item) => {
      const { data: product } = await supabase
        .from("products")
        .select("stock_level, name")
        .eq("id", item.productId)
        .single();

      if (!product) return;

      const newStock = product.stock_level + item.quantity;
      const movId = makeId("#MOV-", movIds, 5);
      movIds.push(movId);

      await Promise.all([
        supabase
          .from("products")
          .update({ stock_level: newStock, status: deriveStatus(newStock) })
          .eq("id", item.productId),
        supabase.from("stock_movements").insert({
          id: movId,
          product_id: item.productId,
          product_name: item.name,
          type: "estorno",
          delta: item.quantity,
          resulting_stock: newStock,
          reason: `Estorno da venda ${saleId}`,
          created_at: now,
        }),
      ]);
    })
  );

  revalidateTag("sales");
  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
