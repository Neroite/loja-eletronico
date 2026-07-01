"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Store, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useStoreConfig } from "@/hooks/use-store-config";
import { STOCK } from "@/lib/stock";

export default function SettingsContent() {
  const router = useRouter();
  const { storeName, storeSegment, setStoreName, setStoreSegment } = useStoreConfig();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Configurações da Loja</h2>
        <p className="text-sm text-slate-500 mt-1">Personalize o sistema conforme a sua operação.</p>
      </div>

      {/* Store config */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Store className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Identidade da Loja</h3>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Nome da Loja
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-colors"
                placeholder="Ex. ByteFlow Pro"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Segmento / Tipo de Loja
              </label>
              <select
                value={storeSegment}
                onChange={(e) => setStoreSegment(e.target.value)}
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
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>

      {/* Stock parameters (read-only reference) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
            Parâmetros de Estoque
          </h3>
          <p className="text-xs text-slate-400 mt-1">Limiares usados para classificar o status dos produtos.</p>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">Crítico</p>
            <p className="text-2xl font-black text-red-700">≤ {STOCK.critical}</p>
            <p className="text-[10px] text-red-400 mt-0.5">unidades</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Estoque Baixo</p>
            <p className="text-2xl font-black text-amber-700">≤ {STOCK.low}</p>
            <p className="text-[10px] text-amber-400 mt-0.5">unidades</p>
          </div>
        </div>
      </div>

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
