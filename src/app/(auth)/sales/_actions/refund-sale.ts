"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
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

  await supabase.from("sales").update({ status: "Cancelado" }).eq("id", saleId);

  const now = new Date().toISOString();
  const { data: existingMovements } = await supabase.from("stock_movements").select("id");
  const movIds = (existingMovements ?? []).map((m) => m.id);

  for (const item of sale.items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_level, name")
      .eq("id", item.productId)
      .single();

    if (!product) continue;

    const newStock = product.stock_level + item.quantity;
    await supabase
      .from("products")
      .update({ stock_level: newStock, status: deriveStatus(newStock) })
      .eq("id", item.productId);

    const movId = makeId("#MOV-", movIds, 5);
    movIds.push(movId);

    await supabase.from("stock_movements").insert({
      id: movId,
      product_id: item.productId,
      product_name: item.name,
      type: "estorno",
      delta: item.quantity,
      resulting_stock: newStock,
      reason: `Estorno da venda ${saleId}`,
      created_at: now,
    });
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
