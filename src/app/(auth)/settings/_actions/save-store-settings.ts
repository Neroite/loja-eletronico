"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { storeSettingsSchema, type StoreSettingsFormValues } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function saveStoreSettings(data: StoreSettingsFormValues): Promise<void> {
  const parsed = storeSettingsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await requireRole(["admin"]);
  await enforceRateLimit("save-store-settings");

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      store_name: parsed.data.storeName,
      store_segment: parsed.data.storeSegment,
      stock_critical: parsed.data.stockCritical,
      stock_low: parsed.data.stockLow,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "singleton");

  if (error) throw error;

  // Os limiares mudaram — reclassifica o status de todos os produtos no banco.
  const { error: recalcError } = await supabase.rpc("recalc_product_statuses");
  if (recalcError) throw recalcError;

  revalidateTag("store_settings");
  revalidateTag("products");
  revalidatePath("/settings", "layout");
}
