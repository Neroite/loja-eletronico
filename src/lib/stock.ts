import { Product } from '../types';

// Single source of truth for stock-status rules.
//
// Os limiares são configuráveis por loja (Configurações → Parâmetros de Estoque,
// persistidos em store_settings). O status de cada produto é SEMPRE derivado no
// servidor: as escritas de estoque passam pela RPC `apply_stock_movement` (que lê
// o singleton) e mudar os limiares dispara `recalc_product_statuses`. Por isso os
// componentes de UI devem confiar em `product.status` (via `needsReplenish`) em
// vez de re-derivar a partir de stock_level com limiares possivelmente velhos.
export const STOCK = {
  critical: 2, // <= 2 units => Crítico (fallback default)
  low: 8       // <= 8 units => Estoque Baixo (fallback default)
} as const;

export type StockThresholds = { critical: number; low: number };

// Usado apenas no caminho de upsert de produto (save-product), que recebe os
// limiares atuais de store_settings; todo o resto deriva no Postgres.
export const deriveStatus = (
  stockLevel: number,
  t: StockThresholds = STOCK
): Product['status'] => {
  if (stockLevel <= t.critical) return 'Crítico';
  if (stockLevel <= t.low) return 'Estoque Baixo';
  return 'Em Estoque';
};

// Items that need restocking (low OR critical) — judged by the stored status.
export const needsReplenish = (status: Product['status']): boolean =>
  status !== 'Em Estoque';
