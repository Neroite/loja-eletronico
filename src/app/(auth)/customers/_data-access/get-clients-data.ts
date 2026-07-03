import { cachedRead } from "@/lib/supabase/read-cache";
import { fromClientRow, fromSaleRow } from "@/lib/supabase";
import type { Client, Sale } from "@/types";

export async function getClientsData(): Promise<{
  clients: Client[];
  sales: Sale[];
}> {
  return cachedRead(["clients-data"], ["clients", "sales"], async (supabase) => {
    const [{ data: clients }, { data: sales }] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      clients: (clients ?? []).map(fromClientRow),
      sales: (sales ?? []).map(fromSaleRow),
    };
  });
}
