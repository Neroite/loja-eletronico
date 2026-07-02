import { createClient } from "@/lib/supabase/server";
import { fromStoreSettingsRow } from "@/lib/supabase";

export async function getStoreSettings(): Promise<{
  storeName: string;
  storeSegment: string;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", "singleton")
    .single();

  return data
    ? fromStoreSettingsRow(data)
    : { storeName: "ByteFlow Pro", storeSegment: "Informática & Eletrônicos" };
}
