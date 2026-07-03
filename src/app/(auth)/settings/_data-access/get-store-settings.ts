import { cachedRead } from "@/lib/supabase/read-cache";
import { fromStoreSettingsRow } from "@/lib/supabase";

export async function getStoreSettings(): Promise<{
  storeName: string;
  storeSegment: string;
}> {
  return cachedRead(["store-settings"], ["store_settings"], async (supabase) => {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "singleton")
      .single();

    return data
      ? fromStoreSettingsRow(data)
      : { storeName: "ByteFlow Pro", storeSegment: "Informática & Eletrônicos" };
  });
}
