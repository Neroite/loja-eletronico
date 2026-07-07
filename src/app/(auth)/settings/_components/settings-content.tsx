"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, Store, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { saveStoreSettings } from "../_actions/save-store-settings";
import { storeSettingsSchema } from "@/lib/schemas";
import UserRolesPanel from "./user-roles-panel";
import type { ProfileRow } from "../_data-access/get-profiles";

interface SettingsContentProps {
  storeName: string;
  storeSegment: string;
  stockCritical: number;
  stockLow: number;
  profiles: ProfileRow[];
  currentUserId: string;
}

export default function SettingsContent({
  storeName,
  storeSegment,
  stockCritical,
  stockLow,
  profiles,
  currentUserId,
}: SettingsContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // z.coerce nos thresholds cria divergência input/output no schema — daí o
  // formato de 3 genéricos (ver gotcha registrado no ProductModal/StockMovementModal).
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    z.input<typeof storeSettingsSchema>,
    unknown,
    z.output<typeof storeSettingsSchema>
  >({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName,
      storeSegment: storeSegment as z.input<typeof storeSettingsSchema>["storeSegment"],
      stockCritical,
      stockLow,
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        await saveStoreSettings(data);
        toast.success("Configurações salvas com sucesso.");
        router.refresh();
      } catch {
        toast.error("Erro ao salvar as configurações. Tente novamente.");
      }
    });
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">Configurações da Loja</h2>
        <p className="text-sm text-slate-500 mt-1">Personalize o sistema conforme a sua operação.</p>
      </div>

      <form onSubmit={onSubmit}>
        {/* Store config */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-brand" />
            <h3 className="font-display text-sm font-semibold text-slate-800 uppercase tracking-wide">Identidade da Loja</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  {...register("storeName")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-colors"
                  placeholder="Ex. ByteFlow Pro"
                />
                {errors.storeName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.storeName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  Segmento / Tipo de Loja
                </label>
                <select
                  {...register("storeSegment")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-colors"
                >
                  <option value="Informática & Eletrônicos">Informática & Eletrônicos</option>
                  <option value="Celulares & Acessórios">Celulares & Acessórios</option>
                  <option value="Games & Consoles">Games & Consoles</option>
                  <option value="Som & Áudio">Som & Áudio</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stock parameters (editable) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-display text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Parâmetros de Estoque
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Limiares usados para classificar o status dos produtos. Ao salvar, todos os produtos são reclassificados.
            </p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">Crítico</p>
              <div className="flex items-center justify-center gap-1">
                <span className="font-mono text-2xl font-semibold text-red-700">≤</span>
                <input
                  type="number"
                  min={0}
                  {...register("stockCritical")}
                  className="w-20 bg-white border border-red-200 rounded-lg px-2 py-1 font-mono tabular-nums text-2xl font-semibold text-red-700 text-center outline-none focus:ring-2 focus:ring-red-300 transition-colors"
                />
              </div>
              <p className="text-[10px] text-red-400 mt-0.5">unidades</p>
              {errors.stockCritical && (
                <p className="text-[11px] text-red-500 mt-1">{errors.stockCritical.message}</p>
              )}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Estoque Baixo</p>
              <div className="flex items-center justify-center gap-1">
                <span className="font-mono text-2xl font-semibold text-amber-700">≤</span>
                <input
                  type="number"
                  min={0}
                  {...register("stockLow")}
                  className="w-20 bg-white border border-amber-200 rounded-lg px-2 py-1 font-mono tabular-nums text-2xl font-semibold text-amber-700 text-center outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
                />
              </div>
              <p className="text-[10px] text-amber-400 mt-0.5">unidades</p>
              {errors.stockLow && (
                <p className="text-[11px] text-red-500 mt-1">{errors.stockLow.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      <UserRolesPanel profiles={profiles} currentUserId={currentUserId} />

      {/* Logout */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Encerrar Sessão</p>
            <p className="text-xs text-slate-500 mt-0.5">Você será redirecionado para a tela de login.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
