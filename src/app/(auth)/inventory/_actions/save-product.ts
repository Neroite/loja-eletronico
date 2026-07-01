"use server";

import { createClient } from "@/lib/supabase/server";
import { toProductRow } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { makeId } from "@/lib/id";
import { deriveStatus } from "@/lib/stock";
import type { Product } from "@/types";

type SaveProductInput = Omit<Product, "status">;

export async function saveProduct(data: SaveProductInput, isEdit: boolean): Promise<void> {
  const supabase = await createClient();

  const product: Product = { ...data, status: deriveStatus(data.stockLevel) };

  if (!isEdit) {
    const { data: existing } = await supabase.from("products").select("id");
    const newId = makeId("#TECH-", (existing ?? []).map((p) => p.id), 4);
    product.id = newId;
  }

  const { error } = await supabase.from("products").upsert(toProductRow(product) as never);
  if (error) throw error;

  if (!isEdit) {
    const { data: existingMovements } = await supabase.from("stock_movements").select("id");
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

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
