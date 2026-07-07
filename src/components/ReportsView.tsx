import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Coins, Receipt, Calculator, Boxes } from 'lucide-react';
import { formatBRL } from '../lib/format';
import type { ReportsData } from '../app/(auth)/reports/_data-access/get-reports-data';

// Paleta dos gráficos ancorada nos tokens brand (globals.css) + acentos de status.
const BRAND = '#6d4fe0';
const BRAND_MID = '#8b6ff0';
const PIE_COLORS = [BRAND, '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', BRAND_MID];

const compactBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

interface ReportsViewProps {
  data: ReportsData;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="font-display text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-display text-sm font-semibold text-slate-800 uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function ReportsView({ data }: ReportsViewProps) {
  const { totals, monthlyRevenue, topProducts, categoryRevenue, paymentDistribution, sellerPerformance } = data;

  return (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">Relatórios de Desempenho</h2>
        <p className="text-sm text-slate-500 mt-1">
          Visão analítica de receita, produtos, categorias e equipe de vendas.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Coins} label="Receita Recebida" value={formatBRL(totals.revenue)} hint="Vendas com status Pago" />
        <StatCard icon={Receipt} label="Vendas Registradas" value={String(totals.salesCount)} hint="Exceto canceladas" />
        <StatCard icon={Calculator} label="Ticket Médio" value={formatBRL(totals.ticket)} hint="Por venda paga" />
        <StatCard icon={Boxes} label="Itens Vendidos" value={String(totals.itemsSold)} hint="Unidades em vendas ativas" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Monthly revenue */}
        <ChartCard
          title="Receita Mensal"
          subtitle="Últimos 6 meses — vendas pagas"
          className="xl:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={compactBRL} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Receita' ? [formatBRL(Number(value)), name] : [value, name]
                  }
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="receita" name="Receita" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Payment methods */}
        <ChartCard title="Formas de Pagamento" subtitle="Participação por nº de vendas">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  dataKey="count"
                  nameKey="method"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {paymentDistribution.map((entry, index) => (
                    <Cell key={entry.method} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, entry) => [
                    `${value} venda(s) — ${formatBRL(entry?.payload?.revenue ?? 0)}`,
                    name,
                  ]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Top products */}
        <ChartCard title="Top Produtos" subtitle="8 maiores por receita — vendas ativas">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={compactBRL} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Receita' ? [formatBRL(Number(value)), name] : [value, name]
                  }
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="revenue" name="Receita" fill={BRAND_MID} radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category revenue */}
        <ChartCard title="Receita por Categoria" subtitle="Vendas ativas, todas as categorias">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryRevenue}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={compactBRL} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={120}
                  tick={{ fontSize: 11, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatBRL(Number(value)), 'Receita']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="revenue" name="Receita" fill={BRAND} radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Seller performance */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-display text-sm font-semibold text-slate-800 uppercase tracking-wide">Desempenho por Vendedor</h3>
          <p className="text-xs text-slate-400 mt-0.5">Vendas ativas, ordenado por receita</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Vendas</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Receita</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sellerPerformance.map((s) => (
                <tr key={s.seller} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3 text-xs font-semibold text-slate-800">{s.seller}</td>
                  <td className="px-6 py-3 text-xs text-slate-600 text-right font-mono tabular-nums">{s.salesCount}</td>
                  <td className="px-6 py-3 text-xs text-slate-800 text-right font-mono tabular-nums font-semibold">{formatBRL(s.revenue)}</td>
                  <td className="px-6 py-3 text-xs text-slate-600 text-right font-mono tabular-nums">{formatBRL(s.ticket)}</td>
                </tr>
              ))}
              {sellerPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
