import { X, Printer, Calendar, User, ShoppingBag, Landmark } from 'lucide-react';
import { Sale } from '../types';
import { formatBRL } from '../lib/format';
import { formatDateBR, formatTime } from '../lib/date';
import StatusBadge from './StatusBadge';

interface SaleDetailsModalProps {
  sale: Sale;
  onClose: () => void;
}

export default function SaleDetailsModal({ sale, onClose }: SaleDetailsModalProps) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <span className="text-[9px] font-black text-brand bg-brand-tint px-2 py-0.5 rounded-full uppercase tracking-widest">
              Comprovante de Venda
            </span>
            <h2 className="text-sm font-extrabold text-slate-800 mt-1.5 font-mono">PEDIDO {sale.id}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[9px]">Data / Horário</p>
              <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDateBR(sale.createdAt)} às {formatTime(sale.createdAt)}</span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[9px]">Vendedor Responsável</p>
              <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{sale.seller}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[9px]">Cliente</p>
              <p className="font-semibold text-slate-700 mt-1">{sale.clientName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{sale.clientDoc}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[9px]">Meio de Pagamento</p>
              <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                <span>{sale.paymentMethod}</span>
              </p>
              <StatusBadge status={sale.status} className="px-2 py-0.5 mt-1.5" />
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-slate-400 font-bold uppercase text-[10px] mb-2 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>Itens da Venda</span>
            </p>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase px-4 py-2 border-b border-slate-200">
                <div className="col-span-6">Descrição</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-4 text-right">Valor Unit</div>
              </div>

              <div className="divide-y divide-slate-200 max-h-40 overflow-y-auto custom-scrollbar">
                {sale.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white transition-colors">
                    <div className="col-span-6 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{item.productId}</p>
                    </div>
                    <div className="col-span-2 text-center font-extrabold text-slate-600">{item.quantity}</div>
                    <div className="col-span-4 text-right font-bold text-slate-800 font-mono">{formatBRL(item.price)}</div>
                  </div>
                ))}

                {sale.items.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-xs">Não há itens registrados.</div>
                )}
              </div>

              <div className="bg-slate-100 px-4 py-3.5 flex justify-between items-center border-t border-slate-200">
                <span className="font-black text-slate-700 text-xs">VALOR TOTAL</span>
                <span className="font-mono font-black text-brand text-base">{formatBRL(sale.totalValue)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comprovante</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
