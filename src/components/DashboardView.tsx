import { useState, useMemo, type ReactNode } from 'react';
import {
  ShoppingCart, DollarSign, TrendingUp, AlertTriangle, ArrowRight, ChevronRight,
  Users, CheckCircle2, Clock, XCircle, Receipt, Boxes, Warehouse, Search, TrendingDown
} from 'lucide-react';
import { Sale, Product, Client } from '../types';
import { STOCK_BANNER_BG, REPORTS_BANNER_BG } from '../initialData';
import { formatBRL } from '../lib/format';
import { needsReplenish } from '../lib/stock';
import {
  Period, PERIOD_LABELS, inPeriod, inMonthYear, previousPeriodMatcher,
  MONTHS_PT_FULL
} from '../lib/date';
import StatusBadge from './StatusBadge';

interface DashboardViewProps {
  sales: Sale[];
  products: Product[];
  clients: Client[];
  onNavigateToTab: (tab: 'dashboard' | 'sales' | 'inventory' | 'customers' | 'settings') => void;
  onOpenNewSale: () => void;
  onViewSaleDetails: (sale: Sale) => void;
}

type Filter =
  | { kind: 'period'; period: Period }
  | { kind: 'monthYear'; month: number; year: number };

const PERIODS: Period[] = ['today', 'thisMonth', 'lastMonth', 'last3Months', 'thisYear'];

export default function DashboardView({
  sales, products, clients, onNavigateToTab, onOpenNewSale, onViewSaleDetails
}: DashboardViewProps) {
  const ref = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState<Filter>({ kind: 'period', period: 'thisMonth' });
  const [query, setQuery] = useState('');

  const years = useMemo(() => {
    const set = new Set(sales.map((s) => new Date(s.createdAt).getFullYear()));
    set.add(ref.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [sales, ref]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Sales within the active period + search
  const periodSales = useMemo(() => {
    const q = query.toLowerCase().trim();
    return sales.filter((s) => {
      const inRange = filter.kind === 'period'
        ? inPeriod(s.createdAt, filter.period, ref)
        : inMonthYear(s.createdAt, filter.month, filter.year);
      if (!inRange) return false;
      if (q && !s.clientName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sales, filter, ref, query]);

  // Previous comparable period (for real deltas)
  const prevSales = useMemo(() => {
    const matcher = filter.kind === 'period'
      ? previousPeriodMatcher(filter.period, ref)
      : (iso: string) => {
          const pm = filter.month === 0 ? 11 : filter.month - 1;
          const py = filter.month === 0 ? filter.year - 1 : filter.year;
          return inMonthYear(iso, pm, py);
        };
    return sales.filter((s) => matcher(s.createdAt));
  }, [sales, filter, ref]);

  const stats = useMemo(() => {
    const active = periodSales.filter((s) => s.status !== 'Cancelado');
    const paid = periodSales.filter((s) => s.status === 'Pago');
    const awaiting = periodSales.filter((s) => s.status === 'Aguard. Retirada');
    const cancelled = periodSales.filter((s) => s.status === 'Cancelado');
    const received = paid.reduce((acc, s) => acc + s.totalValue, 0);
    // Average ticket is per paid sale, so gate the division on paid.length.
    const ticket = paid.length > 0 ? received / paid.length : 0;

    const prevReceived = prevSales
      .filter((s) => s.status === 'Pago')
      .reduce((acc, s) => acc + s.totalValue, 0);
    const prevCount = prevSales.filter((s) => s.status !== 'Cancelado').length;

    const pct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

    return {
      salesCount: active.length,
      paidCount: paid.length,
      awaitingCount: awaiting.length,
      cancelledCount: cancelled.length,
      received,
      ticket,
      deltaSales: pct(active.length, prevCount),
      deltaReceived: pct(received, prevReceived),
      replenish: products.filter((p) => needsReplenish(p.stockLevel)).length,
      stockValue: products.reduce((acc, p) => acc + p.costPrice * p.stockLevel, 0),
      skuCount: products.length
    };
  }, [periodSales, prevSales, products]);

  // Category sales (real, all categories, starts from zero)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    periodSales
      .filter((s) => s.status !== 'Cancelado')
      .forEach((s) =>
        s.items.forEach((item) => {
          const cat = productById.get(item.productId)?.category ?? 'Outros';
          map.set(cat, (map.get(cat) || 0) + item.quantity * item.price);
        })
      );
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [periodSales, productById]);

  const maxCategory = Math.max(...categoryData.map(([, v]) => v), 1);

  const recentSales = useMemo(
    () => [...periodSales].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [periodSales]
  );

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Visão geral de vendas, estoque e clientes da loja.</p>
        </div>
        <button
          onClick={onOpenNewSale}
          className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:shadow-lg active:scale-95 transition-all shadow-md shadow-brand/20"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            aria-label="Buscar cliente"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map((p) => {
            const active = filter.kind === 'period' && filter.period === p;
            return (
              <button
                key={p}
                onClick={() => setFilter({ kind: 'period', period: p })}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  active ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Mês"
            value={filter.kind === 'monthYear' ? filter.month : ref.getMonth()}
            onChange={(e) =>
              setFilter({
                kind: 'monthYear',
                month: parseInt(e.target.value),
                year: filter.kind === 'monthYear' ? filter.year : ref.getFullYear()
              })
            }
            className={`border rounded-lg px-3 py-2 text-xs font-bold outline-none ${
              filter.kind === 'monthYear' ? 'border-brand text-brand bg-brand-tint' : 'border-slate-200 text-slate-600 bg-slate-50'
            }`}
          >
            {MONTHS_PT_FULL.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            aria-label="Ano"
            value={filter.kind === 'monthYear' ? filter.year : ref.getFullYear()}
            onChange={(e) =>
              setFilter({
                kind: 'monthYear',
                month: filter.kind === 'monthYear' ? filter.month : ref.getMonth(),
                year: parseInt(e.target.value)
              })
            }
            className={`border rounded-lg px-3 py-2 text-xs font-bold outline-none ${
              filter.kind === 'monthYear' ? 'border-brand text-brand bg-brand-tint' : 'border-slate-200 text-slate-600 bg-slate-50'
            }`}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard icon={<Users className="w-5 h-5" />} label="Total Clientes" value={clients.length} />
        <MetricCard
          icon={<Receipt className="w-5 h-5" />}
          label="Vendas no Período"
          value={stats.salesCount}
          delta={stats.deltaSales}
        />
        <MetricCard icon={<CheckCircle2 className="w-5 h-5" />} label="Pagos" value={stats.paidCount} tone="green" />
        <MetricCard icon={<Clock className="w-5 h-5" />} label="Aguard. Retirada" value={stats.awaitingCount} tone="amber" />
        <MetricCard icon={<XCircle className="w-5 h-5" />} label="Cancelados" value={stats.cancelledCount} tone="red" />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Valor Recebido"
          value={formatBRL(stats.received)}
          delta={stats.deltaReceived}
          tone="green"
        />
        <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="Ticket Médio" value={formatBRL(stats.ticket)} />
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Itens p/ Repor"
          value={stats.replenish}
          tone={stats.replenish > 0 ? 'red' : 'green'}
        />
        <MetricCard icon={<Boxes className="w-5 h-5" />} label="Valor em Estoque" value={formatBRL(stats.stockValue)} />
        <MetricCard icon={<Warehouse className="w-5 h-5" />} label="SKUs no Catálogo" value={stats.skuCount} />
      </div>

      {/* Chart + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">Categorias Mais Vendidas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Faturamento por categoria no período selecionado</p>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-grow flex items-center justify-center h-64 text-slate-400 text-xs border-b border-slate-100">
              Sem vendas no período selecionado.
            </div>
          ) : (
            <div className="flex-grow flex items-end justify-around pb-4 pt-10 px-4 h-64 border-b border-slate-100">
              {categoryData.map(([category, value]) => {
                const pct = (value / maxCategory) * 80 + 10;
                return (
                  <div key={category} className="flex flex-col items-center gap-4 w-20 group">
                    <div className="w-full bg-slate-100 h-40 rounded-lg flex items-end relative overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-brand to-brand-mid rounded-t-lg transition-all duration-1000 group-hover:from-brand-dark group-hover:to-brand"
                        style={{ height: `${pct}%` }}
                      />
                      <div className="absolute top-1 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-white text-[10px] font-bold py-1 rounded px-1 max-w-[90%] mx-auto shadow-md">
                        {formatBRL(value)}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 text-center leading-tight truncate max-w-full" title={category}>
                      {category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Volume calculado com base nas vendas registradas</span>
            <button
              onClick={() => onNavigateToTab('sales')}
              className="text-brand font-bold hover:underline flex items-center gap-1"
            >
              Ver vendas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent sales */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-900">Vendas Recentes</h3>
              <span className="text-[10px] font-bold text-brand bg-brand-tint px-2 py-0.5 rounded-full">
                {periodSales.length} no período
              </span>
            </div>

            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => onViewSaleDetails(sale)}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors border border-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-brand font-mono">{sale.id}</span>
                    <p className="text-xs font-semibold text-slate-600 truncate mt-0.5" title={sale.clientName}>
                      {sale.clientName}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs font-black text-slate-800">{formatBRL(sale.totalValue)}</p>
                    <StatusBadge status={sale.status} className="px-1.5 py-0.5 mt-0.5" />
                  </div>
                </div>
              ))}

              {recentSales.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Sem vendas neste período.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('sales')}
            className="w-full text-center mt-6 text-brand font-bold text-xs hover:underline flex items-center justify-center gap-1 group py-2 rounded-lg hover:bg-slate-50"
          >
            <span>Ver todas as vendas</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Feature tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <FeatureTile
          bg={STOCK_BANNER_BG}
          ariaLabel="Prateleiras de estoque organizadas"
          gradient="from-brand-dark/95 to-brand/50"
          title="Gestão de Estoque"
          text="Monitore o giro de produtos eletrônicos, defina alertas de reposição e gerencie SKUs."
          cta="Acessar Inventário"
          ctaClass="bg-white text-brand-dark hover:bg-slate-50"
          onClick={() => onNavigateToTab('inventory')}
        />
        <FeatureTile
          bg={REPORTS_BANNER_BG}
          ariaLabel="Componente de tecnologia avançada"
          gradient="from-slate-950/95 to-slate-900/60"
          title="Carteira de Clientes"
          text="Cadastre clientes, acompanhe o histórico de compras e vincule cada venda a um cliente."
          cta="Ver Clientes"
          ctaClass="bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white hover:text-slate-900"
          onClick={() => onNavigateToTab('customers')}
        />
      </div>
    </div>
  );
}

const TONES = {
  brand: { bg: 'bg-brand-tint', text: 'text-brand' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' }
} as const;

function MetricCard({
  icon, label, value, delta, tone = 'brand'
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  delta?: number;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  const showDelta = typeof delta === 'number' && isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-start">
        <span className={`p-2 rounded-xl ring-1 ring-inset ring-black/5 ${t.bg} ${t.text}`}>{icon}</span>
        {showDelta && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${
            up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta!).toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <span className="text-xl font-extrabold text-slate-900 tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function FeatureTile({
  bg, ariaLabel, gradient, title, text, cta, ctaClass, onClick
}: {
  bg: string; ariaLabel: string; gradient: string; title: string; text: string;
  cta: string; ctaClass: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl h-48 group cursor-pointer border border-slate-200 shadow-sm"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('${bg}')` }}
        role="img"
        aria-label={ariaLabel}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} flex flex-col justify-center p-6 text-white`}>
        <h4 className="text-xl font-extrabold tracking-tight mb-2">{title}</h4>
        <p className="text-xs text-white/90 max-w-sm mb-4">{text}</p>
        <span className={`px-4 py-2 rounded-xl font-bold text-xs w-fit transition-colors shadow ${ctaClass}`}>
          {cta}
        </span>
      </div>
    </div>
  );
}
