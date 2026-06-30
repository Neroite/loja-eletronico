import { useState, type FormEvent } from 'react';
import { X, Boxes, Plus, Minus, History, ArrowUp, ArrowDown } from 'lucide-react';
import { Product, StockMovement, StockMovementType } from '../types';
import { formatDateBR, formatTime } from '../lib/date';
import StockBadge from './StockBadge';

interface StockMovementModalProps {
  product: Product;
  movements: StockMovement[]; // already filtered for this product, most-recent first
  onAdjust: (productId: string, delta: number, reason: string) => void;
  onClose: () => void;
}

const TYPE_LABEL: Record<StockMovementType, string> = {
  venda: 'Venda',
  estorno: 'Estorno',
  reposição: 'Reposição',
  ajuste: 'Ajuste',
  cadastro: 'Cadastro'
};

export default function StockMovementModal({
  product,
  movements,
  onAdjust,
  onClose
}: StockMovementModalProps) {
  const [mode, setMode] = useState<'entrada' | 'saida'>('entrada');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (qty < 1) return;
    onAdjust(product.id, mode === 'entrada' ? qty : -qty, reason);
    setQty(1);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Boxes className="w-5 h-5 text-brand shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-brand-dark truncate">{product.name}</h2>
              <p className="text-[10px] font-mono text-slate-400">{product.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current level */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estoque atual</p>
              <p className="text-2xl font-black text-slate-900 leading-tight">
                {product.stockLevel}
                <span className="text-xs font-bold text-slate-400"> / {product.maxStock}</span>
              </p>
            </div>
            <StockBadge status={product.status} />
          </div>

          {/* Adjustment form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Ajuste manual</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('entrada')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  mode === 'entrada'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setMode('saida')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  mode === 'saida'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Saída / Perda
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unidades</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: recebimento, perda, inventário"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-brand/20 active:scale-95 transition-all"
            >
              Registrar ajuste
            </button>
          </form>

          {/* Movement history */}
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Histórico de movimentação
            </p>
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
              {movements.map((mv) => {
                const positive = mv.delta > 0;
                return (
                  <div key={mv.id} className="flex items-center justify-between px-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{TYPE_LABEL[mv.type]}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateBR(mv.createdAt)} · {formatTime(mv.createdAt)}
                        </span>
                      </div>
                      {mv.reason && <p className="text-[10px] text-slate-400 truncate mt-0.5">{mv.reason}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span
                        className={`inline-flex items-center gap-0.5 font-black font-mono ${
                          positive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {positive ? '+' : ''}
                        {mv.delta}
                      </span>
                      <p className="text-[10px] text-slate-400">→ {mv.resultingStock} un.</p>
                    </div>
                  </div>
                );
              })}

              {movements.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma movimentação registrada para este produto ainda.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
