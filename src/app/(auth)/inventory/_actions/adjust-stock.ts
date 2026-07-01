"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deriveStatus } from "@/lib/stock";
import { makeId } from "@/lib/id";

export async function adjustStock(
  productId: string,
  delta: number,
  reason: string
): Promise<void> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("stock_level, name")
    .eq("id", productId)
    .single();

  if (!product) throw new Error("Produto não encontrado");

  const newStock = Math.max(0, product.stock_level + delta);

  await supabase
    .from("products")
    .update({ stock_level: newStock, status: deriveStatus(newStock) })
    .eq("id", productId);

  const { data: existingMovements } = await supabase.from("stock_movements").select("id");
  const movId = makeId("#MOV-", (existingMovements ?? []).map((m) => m.id), 5);

  await supabase.from("stock_movements").insert({
    id: movId,
    product_id: productId,
    product_name: product.name,
    type: "ajuste",
    delta,
    resulting_stock: newStock,
    reason: reason || null,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
