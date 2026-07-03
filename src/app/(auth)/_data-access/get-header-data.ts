import { createClient } from "@/lib/supabase/server";
import { cachedRead } from "@/lib/supabase/read-cache";
import { needsReplenish } from "@/lib/stock";

export async function getHeaderData(): Promise<{
  notificationsCount: number;
  userEmail: string | null;
}> {
  const supabase = await createClient();
  // getUser() precisa dos cookies (não cacheável) e é a fonte autoritativa do e-mail —
  // a contagem de estoque baixo vem de uma leitura cacheada por tag "products".
  const [{ data: userData }, notificationsCount] = await Promise.all([
    supabase.auth.getUser(),
    cachedRead(["header-stock"], ["products"], async (db) => {
      const { data } = await db.from("products").select("stock_level");
      return (data ?? []).filter((p) => needsReplenish(p.stock_level)).length;
    }),
  ]);

  return {
    notificationsCount,
    userEmail: userData.user?.email ?? null,
  };
}
