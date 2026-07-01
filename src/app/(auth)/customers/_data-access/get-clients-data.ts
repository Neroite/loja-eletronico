import { createClient } from "@/lib/supabase/server";
import { fromClientRow, fromSaleRow } from "@/lib/supabase";
import type { Client, Sale } from "@/types";

export async function getClientsData(): Promise<{
  clients: Client[];
  sales: Sale[];
}> {
  const supabase = await createClient();
  const [{ data: clients }, { data: sales }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("sales").select("*").order("created_at", { ascending: false }),
  ]);
  return {
    clients: (clients ?? []).map(fromClientRow),
    sales: (sales ?? []).map(fromSaleRow),
  };
}
