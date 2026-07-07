import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Download, ChevronLeft, ChevronRight, ArrowLeft,
  ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';
import { StockMovement, StockMovementType } from '../types';
import { formatDateBR, formatTime, inPeriod, Period, PERIOD_LABELS } from '../lib/date';
import { downloadCSV } from '../lib/csv';

interface MovementsViewProps {
  movements: StockMovement[];
  searchQuery: string;
}

const TYPE_LABELS: Record<StockMovementType, string> = {
  venda: 'Venda',
  estorno: 'Estorno',
  'reposição': 'Reposição',
  ajuste: 'Ajuste',
  cadastro: 'Cadastro',
};

const TYPE_BADGE: Record<StockMovementType, string> = {
  venda: 'bg-red-50 text-red-700 ring-red-600/20',
  estorno: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'reposição': 'bg-green-50 text-green-700 ring-green-600/20',
  ajuste: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  cadastro: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const ALL_TYPES: StockMovementType[] = ['venda', 'estorno', 'reposição', 'ajuste', 'cadastro'];

export default function MovementsView({ movements, searchQuery }: MovementsViewProps) {
  const [typeFilter, setTypeFilter] = useState<StockMovementType | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<Period | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return movements.filter((m) => {
      if (q) {
        const matches =
          m.productName.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.productId.toLowerCase().includes(q) ||
          (m.reason?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (periodFilter !== 'all' && !inPeriod(m.createdAt, periodFilter)) return false;
      return true;
    });
  }, [movements, searchQuery, typeFilter, periodFilter]);

  // Reset to page 1 whenever the result set changes (same fix as SalesView)
  useEffect(() => setCurrentPage(1), [searchQuery, typeFilter, periodFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfFirstItem = (safePage - 1) * itemsPerPage;
  const pageItems = filtered.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleExport = () => {
    downloadCSV(
      'movimentacoes.csv',
      ['ID', 'Data', 'Hora', 'Produto', 'SKU', 'Tipo', 'Variação', 'Estoque Resultante', 'Motivo'],
      filtered.map((m) => [
        m.id,
        formatDateBR(m.createdAt),
        formatTime(m.createdAt),
        m.productName,
        m.productId,
        TYPE_LABELS[m.type],
        m.delta,
        m.resultingStock,
        m.reason ?? '',
      ])
    );
  };

  return (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar ao Estoque
          </Link>
          <h2 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
            Movimentações de Estoque
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Auditoria completa de entradas e saídas — vendas, estornos, reposições, ajustes e cadastros.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors self-start"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
            typeFilter === 'all'
              ? 'bg-brand text-white'
              : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          Todos
        </button>
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
              typeFilter === t
                ? 'bg-brand text-white'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}

        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as Period | 'all')}
          className="ml-auto bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-brand transition-colors"
        >
          <option value="all">Todo o período</option>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Variação</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estoque Final</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pageItems.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <p className="text-xs font-semibold text-slate-700">{formatDateBR(m.createdAt)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatTime(m.createdAt)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-semibold text-slate-800">{m.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{m.productId}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ring-1 ring-inset ${TYPE_BADGE[m.type]}`}
                    >
                      {TYPE_LABELS[m.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums font-semibold ${
                        m.delta >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {m.delta >= 0 ? (
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                      )}
                      {m.delta >= 0 ? `+${m.delta}` : m.delta}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs font-mono tabular-nums text-slate-700">
                    {m.resultingStock}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 max-w-[220px] truncate" title={m.reason ?? ''}>
                    {m.reason || '—'}
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-400">
                    Nenhuma movimentação encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <p className="text-[11px] text-slate-400 font-medium">
              Exibindo {indexOfFirstItem + 1} a {Math.min(indexOfFirstItem + itemsPerPage, totalItems)} de {totalItems} movimentações
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => handlePageChange(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    pg === safePage
                      ? 'bg-brand text-white'
                      : 'text-slate-600 hover:bg-white border border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
