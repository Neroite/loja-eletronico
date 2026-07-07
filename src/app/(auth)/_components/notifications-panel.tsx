"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import StockBadge from "@/components/StockBadge";
import { bulkReplenish } from "../inventory/_actions/bulk-replenish";
import type { LowStockProduct } from "../_data-access/get-header-data";

interface NotificationsPanelProps {
  notifications: LowStockProduct[];
  onItemClick: (product: LowStockProduct) => void;
  onClose: () => void;
}

export default function NotificationsPanel({
  notifications,
  onItemClick,
  onClose,
}: NotificationsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleReplenishAll = () => {
    startTransition(async () => {
      try {
        await bulkReplenish();
        toast.success("Reposição automática concluída.");
        onClose();
        router.refresh();
      } catch {
        toast.error("Erro na reposição automática.");
      }
    });
  };

  return (
    <>
      {/* Overlay invisível: clique fora fecha o painel (mesmo padrão do menu mobile) */}
      <div className="fixed inset-0 z-20" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-16 right-4 sm:right-6 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn z-30">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h4 className="font-display text-xs font-semibold text-slate-800 uppercase tracking-wide">
          Alertas de Estoque
        </h4>
        {notifications.length > 0 && (
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {notifications.length} item(ns)
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <PackageCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Tudo em ordem!</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Nenhum produto precisa de reposição.</p>
        </div>
      ) : (
        <>
          <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {notifications.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onItemClick(p)}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {p.stockLevel}/{p.maxStock} unidades
                    </p>
                  </div>
                  <StockBadge status={p.status} className="shrink-0" />
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={handleReplenishAll}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              <PackageOpen className="w-3.5 h-3.5" />
              {isPending ? "Repondo..." : "Repor Tudo Automaticamente"}
            </button>
          </div>
        </>
      )}
      </div>
    </>
  );
}
