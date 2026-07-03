"use server";

import { createClient } from "@/lib/supabase/server";
import { toProductRow } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";
import { makeId } from "@/lib/id";
import { deriveStatus } from "@/lib/stock";
import { productSchema } from "@/lib/schemas";
import type { Product } from "@/types";

type SaveProductInput = Omit<Product, "status">;

export async function saveProduct(data: SaveProductInput, isEdit: boolean): Promise<void> {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const supabase = await createClient();

  const product: Product = { ...data, status: deriveStatus(data.stockLevel) };

  if (!isEdit) {
    const { data: existing } = await supabase.from("products").select("id");
    const newId = makeId("#TECH-", (existing ?? []).map((p) => p.id), 4);
    product.id = newId;
  }

  const [{ error }, existingMovements] = await Promise.all([
    supabase.from("products").upsert(toProductRow(product) as never),
    isEdit
      ? Promise.resolve(null)
      : supabase.from("stock_movements").select("id").then((r) => r.data),
  ]);
  if (error) throw error;

  if (!isEdit) {
    const movId = makeId("#MOV-", (existingMovements ?? []).map((m) => m.id), 5);
    await supabase.from("stock_movements").insert({
      id: movId,
      product_id: product.id,
      product_name: product.name,
      type: "cadastro",
      delta: product.stockLevel,
      resulting_stock: product.stockLevel,
      reason: "Produto cadastrado no inventário",
      created_at: new Date().toISOString(),
    });
  }

  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
