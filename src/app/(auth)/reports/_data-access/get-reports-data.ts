import { cachedRead } from "@/lib/supabase/read-cache";
import { fromProductRow, fromSaleRow } from "@/lib/supabase";
import { MONTHS_PT } from "@/lib/date";

export interface MonthlyRevenuePoint {
  month: string; // "Fev/26"
  receita: number;
  vendas: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
}

export interface PaymentSlice {
  method: string;
  count: number;
  revenue: number;
}

export interface SellerPerformance {
  seller: string;
  salesCount: number;
  revenue: number;
  ticket: number;
}

export interface ReportsData {
  totals: {
    revenue: number;
    salesCount: number;
    ticket: number;
    itemsSold: number;
  };
  monthlyRevenue: MonthlyRevenuePoint[];
  topProducts: TopProduct[];
  categoryRevenue: CategoryRevenue[];
  paymentDistribution: PaymentSlice[];
  sellerPerformance: SellerPerformance[];
}

// Agregações computadas no servidor: o client recebe só os pontos prontos dos
// gráficos, não as vendas inteiras. Receita considera apenas vendas "Pago";
// contagens/rankings ignoram vendas canceladas.
export async function getReportsData(): Promise<ReportsData> {
  return cachedRead(["reports-data"], ["sales", "products"], async (supabase) => {
    const [{ data: saleRows }, { data: productRows }] = await Promise.all([
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*"),
    ]);

    const sales = (saleRows ?? []).map(fromSaleRow);
    const products = (productRows ?? []).map(fromProductRow);

    const active = sales.filter((s) => s.status !== "Cancelado");
    const paid = sales.filter((s) => s.status === "Pago");

    // Receita mensal — últimos 6 meses, inclusive o atual
    const now = new Date();
    const monthlyRevenue: MonthlyRevenuePoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const inMonth = (iso: string) => {
        const d = new Date(iso);
        return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
      };
      monthlyRevenue.push({
        month: `${MONTHS_PT[ref.getMonth()]}/${String(ref.getFullYear()).slice(2)}`,
        receita: paid.filter((s) => inMonth(s.createdAt)).reduce((acc, s) => acc + s.totalValue, 0),
        vendas: active.filter((s) => inMonth(s.createdAt)).length,
      });
    }

    // Top produtos e receita por categoria — a partir dos itens (jsonb) das vendas ativas
    const categoryByProductId = new Map(products.map((p) => [p.id, p.category]));
    const byProduct = new Map<string, TopProduct>();
    const byCategory = new Map<string, number>();
    let itemsSold = 0;

    for (const sale of active) {
      for (const item of sale.items) {
        itemsSold += item.quantity;
        const revenue = item.quantity * item.price;

        const prev = byProduct.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
        prev.qty += item.quantity;
        prev.revenue += revenue;
        byProduct.set(item.productId, prev);

        const category = categoryByProductId.get(item.productId) ?? "Outros";
        byCategory.set(category, (byCategory.get(category) ?? 0) + revenue);
      }
    }

    const topProducts = [...byProduct.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const categoryRevenue = [...byCategory.entries()]
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Distribuição por forma de pagamento
    const byPayment = new Map<string, PaymentSlice>();
    for (const sale of active) {
      const prev = byPayment.get(sale.paymentMethod) ?? {
        method: sale.paymentMethod,
        count: 0,
        revenue: 0,
      };
      prev.count += 1;
      prev.revenue += sale.totalValue;
      byPayment.set(sale.paymentMethod, prev);
    }
    const paymentDistribution = [...byPayment.values()].sort((a, b) => b.count - a.count);

    // Desempenho por vendedor
    const bySeller = new Map<string, { salesCount: number; revenue: number }>();
    for (const sale of active) {
      const prev = bySeller.get(sale.seller) ?? { salesCount: 0, revenue: 0 };
      prev.salesCount += 1;
      prev.revenue += sale.totalValue;
      bySeller.set(sale.seller, prev);
    }
    const sellerPerformance: SellerPerformance[] = [...bySeller.entries()]
      .map(([seller, s]) => ({
        seller,
        salesCount: s.salesCount,
        revenue: s.revenue,
        ticket: s.salesCount > 0 ? s.revenue / s.salesCount : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenue = paid.reduce((acc, s) => acc + s.totalValue, 0);

    return {
      totals: {
        revenue,
        salesCount: active.length,
        ticket: paid.length > 0 ? revenue / paid.length : 0,
        itemsSold,
      },
      monthlyRevenue,
      topProducts,
      categoryRevenue,
      paymentDistribution,
      sellerPerformance,
    };
  });
}
