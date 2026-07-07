import { cachedRead } from "@/lib/supabase/read-cache";
import { fromStoreSettingsRow } from "@/lib/supabase";

export interface StoreSettings {
  storeName: string;
  storeSegment: string;
  stockCritical: number;
  stockLow: number;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return cachedRead(["store-settings"], ["store_settings"], async (supabase) => {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "singleton")
      .single();

    return data
      ? fromStoreSettingsRow(data)
      : {
          storeName: "ByteFlow Pro",
          storeSegment: "Informática & Eletrônicos",
          stockCritical: 2,
          stockLow: 8,
        };
  });
}
