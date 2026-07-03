import { cachedRead } from "@/lib/supabase/read-cache";
import { fromSaleRow } from "@/lib/supabase";
import type { Sale } from "@/types";

export async function getSales(): Promise<Sale[]> {
  return cachedRead(["sales-data"], ["sales"], async (supabase) => {
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []).map(fromSaleRow);
  });
}
