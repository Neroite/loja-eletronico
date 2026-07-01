import { createClient } from "@/lib/supabase/server";
import { fromSaleRow } from "@/lib/supabase";
import type { Sale } from "@/types";

export async function getSales(): Promise<Sale[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(fromSaleRow);
}
