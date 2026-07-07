import { useState, useMemo, useEffect, type ReactNode } from 'react';
import {
  UserPlus, Search, ChevronLeft, ChevronRight, Mail, Phone, FileText,
  ShoppingBag, Pencil, Trash2, UserRound, Wallet, Download
} from 'lucide-react';
import { Client, Sale } from '../types';
import { formatBRL } from '../lib/format';
import { formatDateBR } from '../lib/date';
import { downloadCSV } from '../lib/csv';
import { canDelete, canWrite, type Role } from '../lib/auth/roles';
import StatusBadge from './StatusBadge';

interface ClientsViewProps {
  clients: Client[];
  sales: Sale[];
  searchQuery: string;
  role: Role | null;
  onOpenNewClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onViewSaleDetails: (sale: Sale) => void;
}

export default function ClientsView({
  clients,
  sales,
  searchQuery,
  role,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
  onViewSaleDetails
}: ClientsViewProps) {
  const showWrite = !!role && canWrite(role);
  const showDelete = !!role && canDelete(role);
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id ?? null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contactName?.toLowerCase().includes(q) ?? false) ||
        (c.doc?.toLowerCase().includes(q) ?? false)
    );
  }, [clients, searchQuery]);

  // Reset to page 1 whenever the result set changes (same fix as SalesView)
  useEffect(() => setCurrentPage(1), [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageClients = filteredClients.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  // Compras/total por cliente (vendas ativas, match estrito por clientId) para o CSV.
  const handleExportCSV = () => {
    const statsByClient = new Map<string, { purchases: number; total: number }>();
    for (const sale of sales) {
      if (!sale.clientId || sale.status === 'Cancelado') continue;
      const prev = statsByClient.get(sale.clientId) ?? { purchases: 0, total: 0 };
      prev.purchases += 1;
      prev.total += sale.totalValue;
      statsByClient.set(sale.clientId, prev);
    }
    downloadCSV(
      'clientes.csv',
      ['ID', 'Nome', 'Contato', 'Documento', 'E-mail', 'Telefone', 'Cliente desde', 'Compras', 'Total Gasto'],
      filteredClients.map((c) => {
        const stats = statsByClient.get(c.id) ?? { purchases: 0, total: 0 };
        return [
          c.id,
          c.name,
          c.contactName ?? '',
          c.doc ?? '',
          c.email ?? '',
          c.phone ?? '',
          formatDateBR(c.createdAt),
          stats.purchases,
          formatBRL(stats.total),
        ];
      })
    );
  };

  const selectedClient = clients.find((c) => c.id === selectedId) ?? null;

  // Purchase history for the selected client — matched strictly by clientId so that
  // homonymous clients never share each other's sales or spend totals.
  const clientSales = useMemo(() => {
    if (!selectedClient) return [];
    return sales.filter((s) => s.clientId === selectedClient.id);
  }, [sales, selectedClient]);

  const totalSpent = useMemo(
    () => clientSales.filter((s) => s.status !== 'Cancelado').reduce((acc, s) => acc + s.totalValue, 0),
    [clientSales]
  );

  return (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900 tracking-tight">Carteira de Clientes</h3>
          <p className="text-xs text-slate-500 mt-1">
            {clients.length} clientes cadastrados. Selecione um cliente para ver o histórico de compras.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          {showWrite && (
            <button
              onClick={onOpenNewClient}
              className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-brand/20 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Cliente</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] text-slate-400 font-medium">
                {searchQuery ? `Filtrando: "${searchQuery}"` : 'Use a busca do topo para filtrar'}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {pageClients.map((client) => {
              const initial = client.name.charAt(0).toUpperCase();
              const isActive = client.id === selectedId;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive ? 'bg-brand-tint' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                    isActive ? 'bg-brand text-white' : 'bg-slate-100 text-brand'
                  }`}>
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{client.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{client.contactName || client.doc || '—'}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand' : 'text-slate-300'}`} />
                </button>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhum cliente encontrado.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-medium">
                Página {safePage} de {totalPages} · {filteredClients.length} cliente(s)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[70vh] flex flex-col">
          {!selectedClient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <UserRound className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-500">Selecione um cliente</p>
              <p className="text-xs mt-1">Clique em um cliente para ver suas informações</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-mid text-white flex items-center justify-center text-xl font-black shrink-0 shadow-sm shadow-brand/20">
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display text-lg font-semibold text-slate-900 truncate">{selectedClient.name}</h4>
                    <p className="text-xs text-slate-500">
                      {selectedClient.contactName || 'Sem contato responsável'} · Cliente desde {formatDateBR(selectedClient.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {showWrite && (
                    <button
                      onClick={() => onEditClient(selectedClient)}
                      className="p-2 text-slate-400 hover:text-brand hover:bg-brand-tint rounded-lg transition-colors"
                      title="Editar cliente"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {showDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Remover o cliente ${selectedClient.name} da carteira?`)) {
                          onDeleteClient(selectedClient.id);
                          setSelectedId(null);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info + stats */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="Documento" value={selectedClient.doc || '—'} />
                  <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="E-mail" value={selectedClient.email || '—'} />
                  <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Telefone" value={selectedClient.phone || '—'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-brand-tint rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-brand mb-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Compras</span>
                    </div>
                    <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">{clientSales.length}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Total Gasto</span>
                    </div>
                    <p className="font-mono tabular-nums text-base font-semibold text-slate-900 leading-tight mt-1">{formatBRL(totalSpent)}</p>
                  </div>
                </div>
              </div>

              {/* Purchase history */}
              <div className="px-6 pb-6 flex-1 min-h-0 flex flex-col">
                <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Histórico de Compras</h5>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 overflow-y-auto custom-scrollbar">
                  {clientSales.map((sale) => (
                    <button
                      key={sale.id}
                      onClick={() => onViewSaleDetails(sale)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-brand font-mono">{sale.id}</span>
                          <span className="text-[10px] text-slate-400">{formatDateBR(sale.createdAt)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{sale.items.length} item(ns) · {sale.paymentMethod}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-xs font-black text-slate-800">{formatBRL(sale.totalValue)}</span>
                        <StatusBadge status={sale.status} className="px-2 py-0.5" />
                      </div>
                    </button>
                  ))}

                  {clientSales.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Nenhuma compra registrada para este cliente.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
