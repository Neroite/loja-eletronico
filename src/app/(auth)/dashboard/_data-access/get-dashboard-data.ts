import { createClient } from "@/lib/supabase/server";
import { fromProductRow, fromClientRow, fromSaleRow } from "@/lib/supabase";
import type { Product, Sale, Client } from "@/types";

export async function getDashboardData(): Promise<{
  products: Product[];
  sales: Sale[];
  clients: Client[];
}> {
  const supabase = await createClient();
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
}
