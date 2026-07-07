"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import RemoteImage from "./RemoteImage";
import { X, Clipboard, DollarSign, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { saveProduct } from "@/app/(auth)/inventory/_actions/save-product";
import { createClient } from "@/lib/supabase/client";
import { productSchema, type ProductFormValues } from "@/lib/schemas";
import type { Product } from "@/types";
import { PRODUCT_IMAGE_SAMPLES } from "@/initialData";
import { makeId } from "@/lib/id";

const UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_MAX_BYTES = 2 * 1024 * 1024; // 2MB

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({ product: productToEdit, onClose, onSuccess }: ProductModalProps) {
  const isEdit = !!productToEdit;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof productSchema>, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productToEdit
      ? {
          id: productToEdit.id,
          name: productToEdit.name,
          category: productToEdit.category,
          stockLevel: productToEdit.stockLevel,
          maxStock: productToEdit.maxStock,
          costPrice: productToEdit.costPrice,
          salePrice: productToEdit.salePrice,
          imageUrl: productToEdit.imageUrl,
        }
      : {
          // id provisório só para satisfazer o form/preview — o server action
          // save-product.ts regenera e garante unicidade ao salvar (sem round-trip aqui).
          id: makeId("#TECH-", [], 4),
          name: "",
          category: "Hardware",
          stockLevel: 1,
          maxStock: 50,
          costPrice: 10.0,
          salePrice: 20.5,
          imageUrl: PRODUCT_IMAGE_SAMPLES[0].url,
        },
  });
  const imageUrl = watch("imageUrl");

  // Foto enviada pelo usuário (upload direto do browser ao Supabase Storage,
  // sem passar pelo Server Action — evita o bodySizeLimit de ~1MB).
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!UPLOAD_TYPES[file.type]) {
      toast.error("Formato inválido. Envie uma imagem JPG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      toast.error("A imagem deve ter no máximo 2MB.");
      e.target.value = "";
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setImageFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const clearImageFile = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setImageFile(null);
    setLocalPreview(null);
  };

  const uploadImage = async (file: File, productName: string): Promise<string> => {
    const supabase = createClient();
    // Chave sem `#`/acentos (SKUs contêm `#`, inválido em object keys do Storage)
    const slug =
      productName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "produto";
    const path = `products/${Date.now()}-${slug}.${UPLOAD_TYPES[file.type]}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;

    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  const onValid = (data: ProductFormValues) => {
    startTransition(async () => {
      try {
        const finalImageUrl = imageFile ? await uploadImage(imageFile, data.name) : data.imageUrl;

        // O status não é calculado aqui: o server action deriva pelos thresholds
        // configurados em store_settings (fonte única no servidor).
        const productData: Omit<Product, "status"> = {
          id: data.id.trim(),
          name: data.name,
          category: data.category,
          stockLevel: data.stockLevel,
          maxStock: data.maxStock,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          imageUrl: finalImageUrl,
        };

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
            <h2 className="font-display text-sm font-semibold text-brand-dark uppercase">
              {isEdit ? "Editar Produto do Inventário" : "Cadastrar Novo Produto"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onValid)} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SKU / Código</label>
              <input
                type="text"
                disabled={isEdit}
                {...register("id")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-brand disabled:opacity-60"
                placeholder="Ex. #45001-X"
              />
              {errors.id && <p className="text-[10px] text-red-600 mt-1">{errors.id.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Produto</label>
              <input
                type="text"
                {...register("name")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
                placeholder="Ex. SSD NVMe 1TB - Kingston"
              />
              {errors.name && <p className="text-[10px] text-red-600 mt-1">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria / Setor</label>
              <select
                {...register("category")}
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
                {...register("imageUrl")}
                disabled={!!imageFile}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-brand disabled:opacity-50"
              >
                {PRODUCT_IMAGE_SAMPLES.map((imgOpt) => (
                  <option key={imgOpt.url} value={imgOpt.url}>
                    {imgOpt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Ou envie uma foto própria (JPG/PNG/WebP, máx. 2MB)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="flex-1 text-[11px] text-slate-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-brand-tint file:text-brand file:text-[11px] file:font-bold file:cursor-pointer hover:file:bg-brand/10 cursor-pointer"
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={clearImageFile}
                  className="text-[11px] font-bold text-red-600 hover:underline shrink-0"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estoque Inicial (Unids)</label>
              <input
                type="number"
                min={0}
                {...register("stockLevel")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              />
              {errors.stockLevel && <p className="text-[10px] text-red-600 mt-1">{errors.stockLevel.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacidade de Box (Máximo)</label>
              <input
                type="number"
                min={1}
                {...register("maxStock")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              />
              {errors.maxStock && <p className="text-[10px] text-red-600 mt-1">{errors.maxStock.message}</p>}
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
                {...register("costPrice")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              />
              {errors.costPrice && <p className="text-[10px] text-red-600 mt-1">{errors.costPrice.message}</p>}
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
                {...register("salePrice")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-brand outline-none focus:bg-white focus:ring-1 focus:ring-brand"
              />
              {errors.salePrice && <p className="text-[10px] text-red-600 mt-1">{errors.salePrice.message}</p>}
            </div>
          </div>

          {(localPreview || imageUrl) && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                {localPreview ? (
                  // Blob URL local — next/image não otimiza object URLs, preview direto
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localPreview} className="w-full h-full object-cover" alt="Prévia do produto" />
                ) : (
                  <RemoteImage src={imageUrl ?? ""} width={48} height={48} className="w-full h-full object-cover" alt="Prévia do produto" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                {localPreview
                  ? `Foto enviada: ${imageFile?.name} — será usada no lugar da amostra.`
                  : 'Previsualização da foto selecionada.'}
              </p>
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
