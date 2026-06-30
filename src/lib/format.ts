// Centralized currency formatting (BRL). Replaces the copy duplicated across 5 components.
const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export const formatBRL = (val: number): string => brlFormatter.format(val || 0);
