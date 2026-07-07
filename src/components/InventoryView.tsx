import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import RemoteImage from './RemoteImage';
import {
  Plus, Download, Filter, Edit, Trash2, AlertOctagon,
  TrendingDown, Coins, Warehouse, FolderOpen,
  History, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../lib/format';
import { needsReplenish } from '../lib/stock';
import { downloadCSV } from '../lib/csv';
import { canDelete, canWrite, type Role } from '../lib/auth/roles';
import StockBadge, { progressBarColor } from './StockBadge';

interface InventoryViewProps {
  products: Product[];
  searchQuery: string;
  role: Role | null;
  onOpenProductRegister: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkReplenish: () => void;
  onOpenStock: (product: Product) => void;
}

export default function InventoryView({
  products,
  searchQuery,
  role,
  onOpenProductRegister,
  onEditProduct,
  onDeleteProduct,
  onBulkReplenish,
  onOpenStock
}: InventoryViewProps) {
  const showWrite = !!role && canWrite(role);
  const showDelete = !!role && canDelete(role);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (q) {
        const match =
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  // Reset to page 1 whenever the result set changes (mirrors SalesView).
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, statusFilter]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfFirstItem = (safePage - 1) * itemsPerPage;
  const pageProducts = filteredProducts.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const stats = useMemo(() => {
    const totalUnits = products.reduce((acc, p) => acc + p.stockLevel, 0);
    const criticalCount = products.filter((p) => needsReplenish(p.status)).length;
    const stockValuation = products.reduce((acc, p) => acc + p.costPrice * p.stockLevel, 0);
    return { totalUnits, criticalCount, stockValuation };
  }, [products]);

  const handleExportCSV = () => {
    downloadCSV(
      'inventario.csv',
      ['SKU', 'Nome', 'Categoria', 'Estoque', 'Capacidade', 'Status', 'Preço Custo', 'Preço Venda'],
      filteredProducts.map((p) => [
        p.id, p.name, p.category, p.stockLevel, p.maxStock, p.status,
        p.costPrice.toFixed(2), p.salePrice.toFixed(2)
      ])
    );
  };

  return (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header + actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900 tracking-tight">Inventário Geral</h3>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie a disponibilidade e os custos dos produtos em tempo real.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-slate-50 ${
              showFilters ? 'border-brand text-brand' : 'border-slate-200 text-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          {showWrite && (
            <button
              onClick={onOpenProductRegister}
              className="flex items-center gap-2 bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-brand/20"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Produto</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filtrar por Categoria</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedCategory === cat
                      ? 'bg-brand-tint text-brand border border-brand'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estado do Estoque</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'Em Estoque', 'Estoque Baixo', 'Crítico'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    statusFilter === st
                      ? 'bg-brand-tint text-brand border border-brand'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-brand-tint text-brand rounded-lg"><Warehouse className="w-4 h-4" /></span>
            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
              {products.length} SKUs
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">SKUs no Catálogo</p>
            <h4 className="font-mono tabular-nums text-2xl font-semibold text-slate-800">{products.length}</h4>
            <p className="text-[10px] text-slate-400 mt-1">{stats.totalUnits} unidades em estoque geral</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertOctagon className="w-4 h-4" /></span>
            <span className="text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse">
              Atenção
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Abaixo do Mínimo</p>
            <h4 className="font-mono tabular-nums text-2xl font-semibold text-slate-800">{stats.criticalCount}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Itens requerem reposição</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Coins className="w-4 h-4" /></span>
            <span className="text-[10px] text-slate-500 font-extrabold">Valuation</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Custo em Estoque</p>
            <h4 className="font-mono tabular-nums text-2xl font-semibold text-slate-800">{formatBRL(stats.stockValuation)}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Soma de custo unitário × estoque</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><FolderOpen className="w-4 h-4" /></span>
            <span className="text-[10px] text-slate-500 font-bold">Setores</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Departamentos Ativos</p>
            <h4 className="font-mono tabular-nums text-2xl font-semibold text-slate-800">{categories.length - 1}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Categorias cadastradas</p>
          </div>
        </div>
      </div>

      {/* Product list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-display text-base font-semibold text-slate-900">Lista Geral de Produtos</h4>
            <p className="text-xs text-slate-400 mt-0.5">Use as ações de alteração rápida ao passar o mouse na linha</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Resultados: {filteredProducts.length} de {products.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">SKU / Ref</th>
                <th className="px-6 py-4">Nome do Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 w-44">Estoque</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Preço Custo</th>
                <th className="px-6 py-4 text-right">Preço Venda</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {pageProducts.map((product) => {
                const stockPercent = Math.min(100, (product.stockLevel / product.maxStock) * 100);
                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-4 font-mono text-[11px] font-extrabold text-slate-500">{product.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {product.imageUrl ? (
                            <RemoteImage src={product.imageUrl} width={40} height={40} className="w-full h-full object-cover" alt={product.name} />
                          ) : (
                            <Warehouse className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-brand transition-colors">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{product.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 justify-center">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressBarColor(product.status)}`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-500">{product.stockLevel} unidades</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StockBadge status={product.status} /></td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium font-mono">{formatBRL(product.costPrice)}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand font-mono">{formatBRL(product.salePrice)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 group-hover:opacity-100 opacity-20 transition-all duration-150">
                        <button
                          onClick={() => onOpenStock(product)}
                          className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand-tint rounded-lg transition-colors"
                          title="Ajustar estoque / histórico"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {showWrite && (
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand-tint rounded-lg transition-colors"
                            title="Editar Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {showDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Remover ${product.name} (${product.id}) do inventário? Ação irreversível.`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    Nenhum produto condiz com a pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Exibindo <span className="font-bold">{indexOfFirstItem + 1}</span> a{' '}
              <span className="font-bold">{Math.min(indexOfFirstItem + itemsPerPage, totalItems)}</span> de{' '}
              <span className="font-bold">{totalItems}</span> produtos
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
        )}
      </div>

      {/* Replenishment panels */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-brand to-brand-mid text-white p-6 rounded-2xl flex items-center justify-between gap-6 shadow-md shadow-brand/20 relative overflow-hidden group">
          <div className="z-10 flex-1">
            <h5 className="font-display text-lg font-semibold mb-1 tracking-tight">Reposição Sugerida</h5>
            <p className="text-white/85 text-xs mb-4 max-w-sm">
              {stats.criticalCount} item(ns) estão abaixo do nível mínimo e podem ser repostos automaticamente à capacidade máxima.
            </p>
            {showWrite && (
              <button
                onClick={onBulkReplenish}
                className="bg-white text-brand hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-xs shadow transition-colors active:scale-95"
              >
                Gerar Ordem de Compra Automática
              </button>
            )}
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <TrendingDown className="w-40 h-40 text-white" />
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-5 border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0 border border-brand/5">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">Movimentações de Estoque</h5>
            <p className="text-xs text-slate-500 mt-1">
              Auditoria completa de entradas, saídas, vendas, estornos e reposições de todos os produtos.
            </p>
            <Link
              href="/inventory/movements"
              className="text-brand font-bold text-[11px] mt-2 inline-block hover:underline"
            >
              Ver Histórico Completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
