"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { needsReplenish, deriveStatus } from "@/lib/stock";
import { makeId } from "@/lib/id";

export async function bulkReplenish(): Promise<void> {
  const supabase = await createClient();

  const { data: products } = await supabase.from("products").select("*");
  if (!products) return;

  const lowProducts = products.filter((p) => needsReplenish(p.stock_level));
  if (lowProducts.length === 0) return;

  const { data: existingMovements } = await supabase.from("stock_movements").select("id");
  const movIds = (existingMovements ?? []).map((m) => m.id);
  const now = new Date().toISOString();

  await Promise.all(
    lowProducts.map(async (p) => {
      const delta = p.max_stock - p.stock_level;
      if (delta <= 0) return;

      const movId = makeId("#MOV-", movIds, 5);
      movIds.push(movId);

      await Promise.all([
        supabase
          .from("products")
          .update({ stock_level: p.max_stock, status: deriveStatus(p.max_stock) })
          .eq("id", p.id),
        supabase.from("stock_movements").insert({
          id: movId,
          product_id: p.id,
          product_name: p.name,
          type: "reposição",
          delta,
          resulting_stock: p.max_stock,
          reason: "Reposição automática em massa",
          created_at: now,
        }),
      ]);
    })
  );

  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
