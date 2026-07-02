import { createClient } from "@/lib/supabase/server";
import { needsReplenish } from "@/lib/stock";

export async function getHeaderData(): Promise<{
  notificationsCount: number;
  userEmail: string | null;
}> {
  const supabase = await createClient();
  const [{ data: products }, { data: userData }] = await Promise.all([
    supabase.from("products").select("stock_level"),
    supabase.auth.getUser(),
  ]);

  const notificationsCount = (products ?? []).filter((p) =>
    needsReplenish(p.stock_level)
  ).length;

  return {
    notificationsCount,
    userEmail: userData.user?.email ?? null,
  };
}
