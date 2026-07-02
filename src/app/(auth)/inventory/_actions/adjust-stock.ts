"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deriveStatus } from "@/lib/stock";
import { makeId } from "@/lib/id";
import { adjustStockSchema, type AdjustStockFormValues } from "@/lib/schemas";

export async function adjustStock(
  productId: string,
  data: AdjustStockFormValues
): Promise<void> {
  const parsed = adjustStockSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const supabase = await createClient();

  const [{ data: product }, { data: existingMovements }] = await Promise.all([
    supabase.from("products").select("stock_level, name").eq("id", productId).single(),
    supabase.from("stock_movements").select("id"),
  ]);

  if (!product) throw new Error("Produto não encontrado");

  const delta = parsed.data.mode === "entrada" ? parsed.data.qty : -parsed.data.qty;
  const newStock = product.stock_level + delta;

  if (newStock < 0) {
    throw new Error(
      `Estoque insuficiente: há ${product.stock_level} unidade(s), não é possível dar saída de ${parsed.data.qty}.`
    );
  }

  const movId = makeId("#MOV-", (existingMovements ?? []).map((m) => m.id), 5);

  await supabase
    .from("products")
    .update({ stock_level: newStock, status: deriveStatus(newStock) })
    .eq("id", productId);

  await supabase.from("stock_movements").insert({
    id: movId,
    product_id: productId,
    product_name: product.name,
    type: "ajuste",
    delta,
    resulting_stock: newStock,
    reason: parsed.data.reason || null,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
