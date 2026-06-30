import { Product } from '../types';

// Shared product stock-status badge — consolidates getStatusStyle/getProgressBarColor.
const BADGE: Record<Product['status'], string> = {
  'Em Estoque': 'bg-green-50 text-green-700 ring-green-600/20',
  'Estoque Baixo': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Crítico': 'bg-red-50 text-red-700 ring-red-600/20'
};

const DOT: Record<Product['status'], string> = {
  'Em Estoque': 'bg-green-500',
  'Estoque Baixo': 'bg-amber-500',
  'Crítico': 'bg-red-500'
};

// Progress bar uses a subtle vertical gradient for extra depth.
const BAR: Record<Product['status'], string> = {
  'Em Estoque': 'bg-gradient-to-r from-green-400 to-green-500',
  'Estoque Baixo': 'bg-gradient-to-r from-amber-400 to-amber-500',
  'Crítico': 'bg-gradient-to-r from-red-400 to-red-500'
};

export const progressBarColor = (status: Product['status']): string => BAR[status];

interface StockBadgeProps {
  status: Product['status'];
  className?: string;
}

export default function StockBadge({ status, className = '' }: StockBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ring-1 ring-inset ${BADGE[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`} />
      {status}
    </span>
  );
}
