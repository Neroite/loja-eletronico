import { createClient } from "@/lib/supabase/server";
import { fromProductRow, fromMovementRow } from "@/lib/supabase";
import type { Product, StockMovement } from "@/types";

export async function getInventoryData(): Promise<{
  products: Product[];
  movements: StockMovement[];
}> {
  const supabase = await createClient();
  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("stock_movements").select("*").order("created_at", { ascending: false }),
  ]);
  return {
    products: (products ?? []).map(fromProductRow),
    movements: (movements ?? []).map(fromMovementRow),
  };
}
