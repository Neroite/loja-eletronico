import { cachedRead } from "@/lib/supabase/read-cache";
import { fromMovementRow } from "@/lib/supabase";
import type { StockMovement } from "@/types";

export async function getMovements(): Promise<StockMovement[]> {
  return cachedRead(["movements-data"], ["stock_movements"], async (supabase) => {
    const { data } = await supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []).map(fromMovementRow);
  });
}
