import { createClient } from "@/lib/supabase/server";
import { cachedRead } from "@/lib/supabase/read-cache";
import { needsReplenish } from "@/lib/stock";
import type { Role } from "@/lib/auth/roles";
import type { Product } from "@/types";

export interface LowStockProduct {
  id: string;
  name: string;
  stockLevel: number;
  maxStock: number;
  status: Product["status"];
}

export async function getHeaderData(): Promise<{
  notificationsCount: number;
  lowStockProducts: LowStockProduct[];
  userEmail: string | null;
  role: Role | null;
}> {
  const supabase = await createClient();
  // getUser() precisa dos cookies (não cacheável) e é a fonte autoritativa do e-mail —
  // os alertas de estoque vêm de uma leitura cacheada. A tag "store_settings" entra
  // porque mudar os thresholds reclassifica os produtos (recalc_product_statuses).
  const [{ data: userData }, lowStock] = await Promise.all([
    supabase.auth.getUser(),
    cachedRead(["header-stock"], ["products", "store_settings"], async (db) => {
      const { data } = await db
        .from("products")
        .select("id, name, stock_level, max_stock, status")
        .order("stock_level", { ascending: true });
      return (data ?? [])
        .filter((p) => needsReplenish(p.status as Product["status"]))
        .map((p) => ({
          id: p.id,
          name: p.name,
          stockLevel: p.stock_level,
          maxStock: p.max_stock,
          status: p.status as Product["status"],
        }));
    }),
  ]);

  const userId = userData.user?.id;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).single()
    : { data: null };

  return {
    notificationsCount: lowStock.length,
    // Críticos primeiro (já vem ordenado por estoque crescente); cap para o painel.
    lowStockProducts: lowStock.slice(0, 15),
    userEmail: userData.user?.email ?? null,
    role: (profile?.role as Role) ?? null,
  };
}
