import { Product } from '../types';

// Single source of truth for stock-status rules.
// Previously this logic was copy-pasted in App.tsx (x2) and ProductModal, with the
// magic number `<= 8` scattered across 6 more spots — and "Crítico" meant `<=2` in
// some places but `<=8` in others. Now there is one consistent definition.
export const STOCK = {
  critical: 2, // <= 2 units => Crítico
  low: 8       // <= 8 units => Estoque Baixo
} as const;

export const deriveStatus = (stockLevel: number): Product['status'] => {
  if (stockLevel <= STOCK.critical) return 'Crítico';
  if (stockLevel <= STOCK.low) return 'Estoque Baixo';
  return 'Em Estoque';
};

export const isCritical = (stockLevel: number): boolean => stockLevel <= STOCK.critical;
export const isLow = (stockLevel: number): boolean => stockLevel <= STOCK.low;

// Items that need restocking (low OR critical).
export const needsReplenish = (stockLevel: number): boolean => stockLevel <= STOCK.low;
