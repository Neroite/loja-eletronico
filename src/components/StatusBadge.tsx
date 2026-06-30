import { SaleStatus } from '../types';

// Shared sale-status badge — replaces the color ternary duplicated across
// DashboardView, SalesView and SaleDetailsModal.
const STYLES: Record<SaleStatus, string> = {
  'Pago': 'bg-green-50 text-green-700 ring-green-600/20',
  'Aguard. Retirada': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Cancelado': 'bg-red-50 text-red-700 ring-red-600/20'
};

const DOT: Record<SaleStatus, string> = {
  'Pago': 'bg-green-500',
  'Aguard. Retirada': 'bg-amber-500',
  'Cancelado': 'bg-red-500'
};

interface StatusBadgeProps {
  status: SaleStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight ring-1 ring-inset ${STYLES[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`} />
      {status}
    </span>
  );
}
