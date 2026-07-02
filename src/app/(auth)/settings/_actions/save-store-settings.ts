"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { storeSettingsSchema, type StoreSettingsFormValues } from "@/lib/schemas";

export async function saveStoreSettings(data: StoreSettingsFormValues): Promise<void> {
  const parsed = storeSettingsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      store_name: parsed.data.storeName,
      store_segment: parsed.data.storeSegment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "singleton");

  if (error) throw error;

  revalidatePath("/settings", "layout");
}
