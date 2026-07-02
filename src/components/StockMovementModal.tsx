"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { X, Boxes, Plus, Minus, History, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { fromMovementRow } from "@/lib/supabase";
import { adjustStock } from "@/app/(auth)/inventory/_actions/adjust-stock";
import { adjustStockSchema, type AdjustStockFormValues } from "@/lib/schemas";
import type { Product, StockMovement, StockMovementType } from "@/types";
import { formatDateBR, formatTime } from "@/lib/date";
import StockBadge from "./StockBadge";

interface StockMovementModalProps {
  product: Product;
  movements: StockMovement[];
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_LABEL: Record<StockMovementType, string> = {
  venda: "Venda",
  estorno: "Estorno",
  reposição: "Reposição",
  ajuste: "Ajuste",
  cadastro: "Cadastro",
};

export default function StockMovementModal({ product, movements: initialMovements, onClose, onSuccess }: StockMovementModalProps) {
  const [isPending, startTransition] = useTransition();
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof adjustStockSchema>, unknown, AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { mode: "entrada", qty: 1, reason: "" },
  });
  const mode = watch("mode");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setMovements(data.map(fromMovementRow));
      });
  }, [product.id]);

  const onValid = (data: AdjustStockFormValues) => {
    startTransition(async () => {
      try {
        await adjustStock(product.id, data);
        toast.success("Ajuste de estoque registrado.");
        reset({ mode: "entrada", qty: 1, reason: "" });
        onSuccess();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao registrar o ajuste.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Boxes className="w-5 h-5 text-brand shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold text-brand-dark truncate">{product.name}</h2>
              <p className="text-[10px] font-mono text-slate-400">{product.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estoque atual</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900 leading-tight">
                {product.stockLevel}
                <span className="text-xs font-bold text-slate-400"> / {product.maxStock}</span>
              </p>
            </div>
            <StockBadge status={product.status} />
          </div>

          <form onSubmit={handleSubmit(onValid)} className="space-y-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Ajuste manual</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue("mode", "entrada")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  mode === "entrada"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setValue("mode", "saida")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  mode === "saida"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
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
                  {...register("qty")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                />
                {errors.qty && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.qty.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  {...register("reason")}
                  placeholder="Ex.: recebimento, perda, inventário"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Registrar ajuste
            </button>
          </form>

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
                      <span className={`inline-flex items-center gap-0.5 font-semibold font-mono tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>
                        {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {positive ? "+" : ""}
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
