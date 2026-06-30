// Real date handling for sales. Sales carry an ISO `createdAt`; display strings are
// derived from it (no more hardcoded "2026" or fake "today" filters).

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const MONTHS_PT_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const formatDateBR = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toTimeString().split(' ')[0];
};

export type Period = 'today' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear';

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  thisMonth: 'Este mês',
  lastMonth: 'Mês passado',
  last3Months: 'Últimos 3 meses',
  thisYear: 'Este ano'
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Whether an ISO timestamp falls within a named period, relative to `ref` (defaults to now).
 */
export const inPeriod = (iso: string, period: Period, ref: Date = new Date()): boolean => {
  const d = new Date(iso);
  switch (period) {
    case 'today':
      return startOfDay(d).getTime() === startOfDay(ref).getTime();
    case 'thisMonth':
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    case 'lastMonth': {
      const lm = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    }
    case 'last3Months': {
      const from = new Date(ref.getFullYear(), ref.getMonth() - 2, 1);
      return d.getTime() >= from.getTime() && d.getTime() <= ref.getTime();
    }
    case 'thisYear':
      return d.getFullYear() === ref.getFullYear();
    default:
      return true;
  }
};

/** Whether an ISO timestamp falls in a specific month/year (for the dropdown filters). */
export const inMonthYear = (iso: string, month: number, year: number): boolean => {
  const d = new Date(iso);
  return d.getMonth() === month && d.getFullYear() === year;
};

/** The comparable previous period range, used to compute real period-over-period deltas. */
export const previousPeriodMatcher = (period: Period, ref: Date = new Date()): ((iso: string) => boolean) => {
  switch (period) {
    case 'today': {
      const y = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1);
      return (iso) => startOfDay(new Date(iso)).getTime() === y.getTime();
    }
    case 'thisMonth':
      return (iso) => inPeriod(iso, 'lastMonth', ref);
    case 'lastMonth': {
      const prev = new Date(ref.getFullYear(), ref.getMonth() - 2, 1);
      return (iso) => {
        const d = new Date(iso);
        return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
      };
    }
    case 'last3Months': {
      const to = new Date(ref.getFullYear(), ref.getMonth() - 2, 1);
      const from = new Date(ref.getFullYear(), ref.getMonth() - 5, 1);
      return (iso) => {
        const t = new Date(iso).getTime();
        return t >= from.getTime() && t < to.getTime();
      };
    }
    case 'thisYear':
      return (iso) => new Date(iso).getFullYear() === ref.getFullYear() - 1;
    default:
      return () => false;
  }
};
