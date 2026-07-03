import { cachedRead } from "@/lib/supabase/read-cache";
import { fromProductRow, fromClientRow, fromSaleRow } from "@/lib/supabase";
import type { Product, Sale, Client } from "@/types";

export async function getDashboardData(): Promise<{
  products: Product[];
  sales: Sale[];
  clients: Client[];
}> {
  return cachedRead(
    ["dashboard-data"],
    ["products", "sales", "clients"],
    async (supabase) => {
      const [{ data: products }, { data: sales }, { data: clients }] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*"),
      ]);
      return {
        products: (products ?? []).map(fromProductRow),
        sales: (sales ?? []).map(fromSaleRow),
        clients: (clients ?? []).map(fromClientRow),
      };
    },
  );
}
