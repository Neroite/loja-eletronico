import { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Download, Filter, Eye, ChevronLeft, ChevronRight,
  CreditCard, QrCode, DollarSign, Undo2, AlertCircle
} from 'lucide-react';
import { Sale, PaymentMethod, SaleStatus } from '../types';
import { formatBRL } from '../lib/format';
import { formatDateBR, formatTime, inPeriod } from '../lib/date';
import { downloadCSV } from '../lib/csv';
import StatusBadge from './StatusBadge';

interface SalesViewProps {
  sales: Sale[];
  searchQuery: string;
  onViewSaleDetails: (sale: Sale) => void;
  onRefundSale: (saleId: string) => void;
}

type DateFilter = 'all' | 'today' | '7days';

export default function SalesView({ sales, searchQuery, onViewSaleDetails, onRefundSale }: SalesViewProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all');
  const [pMethodFilter, setPMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    return sales.filter((sale) => {
      if (q) {
        const matchId = sale.id.toLowerCase().includes(q);
        const matchClient =
          sale.clientName.toLowerCase().includes(q) ||
          (sale.clientDoc?.toLowerCase().includes(q) ?? false);
        const matchSeller = sale.seller.toLowerCase().includes(q);
        const matchItem = sale.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchId && !matchClient && !matchSeller && !matchItem) return false;
      }
      if (statusFilter !== 'all' && sale.status !== statusFilter) return false;
      if (pMethodFilter !== 'all' && sale.paymentMethod !== pMethodFilter) return false;

      if (dateFilter === 'today' && !inPeriod(sale.createdAt, 'today', now)) return false;
      if (dateFilter === '7days') {
        const d = new Date(sale.createdAt);
        if (d < weekAgo) return false;
      }
      return true;
    });
  }, [sales, searchQuery, statusFilter, pMethodFilter, dateFilter]);

  // Reset to page 1 whenever the result set changes (fixes the stale-page empty table bug)
  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter, pMethodFilter, dateFilter]);

  const totalItems = filteredSales.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfFirstItem = (safePage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentSalesItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'Cartão Crédito': return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'PIX': return <QrCode className="w-4 h-4 text-cyan-600" />;
      case 'Dinheiro': return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'Debito': return <CreditCard className="w-4 h-4 text-blue-600" />;
      default: return <CreditCard className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleExport = () => {
    downloadCSV(
      'vendas.csv',
      ['ID', 'Data', 'Hora', 'Cliente', 'Documento', 'Vendedor', 'Pagamento', 'Status', 'Total'],
      filteredSales.map((s) => [
        s.id, formatDateBR(s.createdAt), formatTime(s.createdAt), s.clientName,
        s.clientDoc, s.seller, s.paymentMethod, s.status, s.totalValue.toFixed(2)
      ])
    );
  };

  const dateButtons: { id: DateFilter; label: string }[] = [
    { id: 'all', label: 'Exibir Tudo' },
    { id: 'today', label: 'Hoje' },
    { id: '7days', label: 'Últimos 7 dias' }
  ];

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
            {dateButtons.map((b) => (
              <button
                key={b.id}
                onClick={() => setDateFilter(b.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  dateFilter === b.id ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Histórico completo de vendas</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 bg-white px-4 py-2 border rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-slate-50 ${
              showFilters ? 'border-brand text-brand' : 'border-slate-200 text-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros Avançados</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-brand-dark hover:bg-brand-ink text-white py-2 px-5 rounded-xl text-xs font-bold hover:shadow-lg active:scale-95 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filtrar por Status</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'Pago', 'Aguard. Retirada', 'Cancelado'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    statusFilter === st
                      ? 'bg-brand-tint text-brand border border-brand'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Meio de Pagamento</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'Cartão Crédito', 'PIX', 'Dinheiro', 'Debito'] as const).map((pm) => (
                <button
                  key={pm}
                  onClick={() => setPMethodFilter(pm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    pMethodFilter === pm
                      ? 'bg-brand-tint text-brand border border-brand'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {pm === 'all' ? 'Todos' : pm}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPMethodFilter('all');
                setDateFilter('all');
              }}
              className="text-xs font-bold text-brand hover:underline"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">LISTA DE TRANSAÇÕES</h3>
            <p className="text-[10px] text-slate-400 font-medium">Histórico de vendas e estornos</p>
          </div>
          <span className="text-xs font-bold text-brand bg-brand-tint px-3 py-1 rounded-full">
            Total: {totalItems} {totalItems === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">ID Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Vendedor</th>
                <th className="px-6 py-4">Pagamento</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {currentSalesItems.map((sale) => (
                <tr
                  key={sale.id}
                  className={`hover:bg-slate-50/70 transition-colors group ${
                    sale.status === 'Cancelado' ? 'bg-red-50/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-800">{formatDateBR(sale.createdAt)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{formatTime(sale.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-extrabold text-brand">{sale.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{sale.clientName}</p>
                    {sale.clientDoc && (
                      <p className="text-[10px] text-slate-400 mt-0.5 tracking-tight font-medium">{sale.clientDoc}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{sale.seller}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(sale.paymentMethod)}
                      <span className="font-semibold text-slate-700">{sale.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900 font-mono">
                    {formatBRL(sale.totalValue)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sale.status} className="px-2.5 py-0.5" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewSaleDetails(sale)}
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand-tint rounded-lg transition-colors"
                        title="Detalhes da Venda"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {sale.status !== 'Cancelado' ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`Realizar o ESTORNO da venda ${sale.id}? Os itens retornarão ao estoque.`)) {
                              onRefundSale(sale.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Estornar Venda (Devolver ao Estoque)"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button disabled className="p-1.5 text-slate-200 cursor-not-allowed" title="Venda já Cancelada">
                          <Undo2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {currentSalesItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                    <p className="text-sm">Nenhum lançamento encontrado para os filtros ativos.</p>
                    <p className="text-xs text-slate-400 font-normal mt-1">Tente outro SKU, ID ou nome de cliente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold">{totalItems === 0 ? 0 : indexOfFirstItem + 1}</span> a{' '}
            <span className="font-bold">{Math.min(indexOfLastItem, totalItems)}</span> de{' '}
            <span className="font-bold">{totalItems}</span> resultados
          </p>

          <div className="flex items-center gap-2">
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
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  safePage === pg
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
      </div>

      {/* Notice */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-brand-tint/65 border border-slate-200 rounded-xl">
        <AlertCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-extrabold text-brand-dark uppercase">Guia de Estorno</h5>
          <p className="text-xs text-slate-600 mt-1">
            Ao estornar uma venda, o status muda para <strong>Cancelado</strong> e todas as quantidades dos produtos
            voltam instantaneamente para o estoque, mantendo a integridade do inventário.
          </p>
        </div>
      </div>
    </div>
  );
}
