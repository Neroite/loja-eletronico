"use client";

import { useState, useEffect, useTransition, type FormEvent } from "react";
import { X, Clipboard, DollarSign, Image as ImageIcon, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { saveProduct } from "@/app/(auth)/inventory/_actions/save-product";
import type { Product } from "@/types";
import { PRODUCT_IMAGE_SAMPLES } from "@/initialData";
import { deriveStatus } from "@/lib/stock";
import { makeId } from "@/lib/id";

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({ product: productToEdit, onClose, onSuccess }: ProductModalProps) {
  const isEdit = !!productToEdit;
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [stockLevel, setStockLevel] = useState(1);
  const [maxStock, setMaxStock] = useState(50);
  const [costPrice, setCostPrice] = useState(10.0);
  const [salePrice, setSalePrice] = useState(20.5);
  const [imageUrl, setImageUrl] = useState(PRODUCT_IMAGE_SAMPLES[0].url);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("products").select("id").then(({ data }) => {
      const ids = (data ?? []).map((r) => r.id);
      setExistingIds(ids);
      if (!productToEdit) {
        setSku(makeId("#TECH-", ids, 4));
      }
    });
  }, [productToEdit]);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.id);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setStockLevel(productToEdit.stockLevel);
      setMaxStock(productToEdit.maxStock);
      setCostPrice(productToEdit.costPrice);
      setSalePrice(productToEdit.salePrice);
      setImageUrl(productToEdit.imageUrl);
    }
  }, [productToEdit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError("Preencha o SKU e o nome do produto.");
      return;
    }
    if (!isEdit && existingIds.includes(sku.trim())) {
      setError(`O SKU ${sku.trim()} já existe. Escolha outro código.`);
      return;
    }
    if (stockLevel > maxStock) {
      setError("O estoque inicial não pode ser maior que a capacidade do box.");
      return;
    }
    if (salePrice < costPrice) {
      setError("O preço de venda não pode ser menor que o preço de custo.");
      return;
    }

    const productData: Product = {
      id: sku.trim(),
      name,
      category,
      stockLevel,
      maxStock,
      status: deriveStatus(stockLevel),
      costPrice,
      salePrice,
      imageUrl,
    };

    startTransition(async () => {
      try {
        await saveProduct(productData, isEdit);
        toast.success(isEdit ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
        onSuccess();
      } catch {
        toast.error("Erro ao salvar o produto. Tente novamente.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-brand" />
            <h2 className="text-sm font-extrabold text-brand-dark uppercase">
              {isEdit ? "Editar Produto do Inventário" : "Cadastrar Novo Produto"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SKU / Código</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={isEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-brand disabled:opacity-60"
                placeholder="Ex. #45001-X"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Produto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="Ex. SSD NVMe 1TB - Kingston"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria / Setor</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              >
                <option value="Armazenamento">Armazenamento</option>
                <option value="Periféricos">Periféricos</option>
                <option value="Hardware">Hardware / Componentes</option>
                <option value="Monitores">Monitores e Displays</option>
                <option value="Acessórios">Acessórios / Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Foto Demonstrativa</span>
              </label>
              <select
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              >
                {PRODUCT_IMAGE_SAMPLES.map((imgOpt) => (
                  <option key={imgOpt.url} value={imgOpt.url}>
                    {imgOpt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estoque Inicial (Unids)</label>
              <input
                type="number"
                min={0}
                value={stockLevel}
                onChange={(e) => setStockLevel(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacidade de Box (Máximo)</label>
              <input
                type="number"
                min={1}
                value={maxStock}
                onChange={(e) => setMaxStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Preço Custo (R$)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-brand" />
                <span>Preço Venda (R$)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-brand outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                required
              />
            </div>
          </div>

          {imageUrl && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                <img src={imageUrl} className="w-full h-full object-cover" alt="Prévia do produto" referrerPolicy="no-referrer" />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Previsualização da foto selecionada.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-[11px] font-semibold px-3 py-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-brand/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
