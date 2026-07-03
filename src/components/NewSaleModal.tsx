"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Trash2, User, UserCheck, Coins, AlertTriangle, Receipt, ClipboardCheck, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { fromProductRow, fromClientRow } from "@/lib/supabase";
import { registerSale } from "@/app/(auth)/sales/_actions/register-sale";
import { saleSchema } from "@/lib/schemas";
import { z } from "zod";
import type { Product, Client, SaleItem } from "@/types";
import { formatBRL } from "@/lib/format";
import { isLow } from "@/lib/stock";

const saleFormFieldsSchema = saleSchema.omit({ items: true });
type SaleFormFields = z.infer<typeof saleFormFieldsSchema>;

interface NewSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const WALK_IN = "walk-in";

export default function NewSaleModal({ onClose, onSuccess }: NewSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("clients").select("*").order("name"),
    ]).then(([{ data: prods }, { data: clis }]) => {
      setProducts((prods ?? []).map(fromProductRow));
      setClients((clis ?? []).map(fromClientRow));
      setLoadingData(false);
    });
  }, []);

  const {
    register,
    handleSubmit,
  } = useForm<z.input<typeof saleFormFieldsSchema>, unknown, SaleFormFields>({
    resolver: zodResolver(saleFormFieldsSchema),
    defaultValues: {
      clientChoice: WALK_IN,
      seller: "Marcos Silva",
      paymentMethod: "Cartão Crédito",
      status: "Pago",
    },
  });
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const productOptions = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  useEffect(() => {
    if (!productOptions.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(productOptions[0]?.id ?? "");
    }
  }, [productOptions, selectedProductId]);

  const handleAddToCart = () => {
    const p = productById.get(selectedProductId);
    if (!p) return;
    if (p.stockLevel <= 0) {
      toast.error("Produto esgotado no estoque! Escolha outro item.");
      return;
    }
    const existing = cart.find((c) => c.productId === selectedProductId);
    const targetQty = (existing ? existing.quantity : 0) + selectedQuantity;
    if (targetQty > p.stockLevel) {
      toast.error(`Quantidade excede o disponível de ${p.stockLevel} unidades para este produto.`);
      return;
    }
    setCart((prev) =>
      existing
        ? prev.map((c) => (c.productId === selectedProductId ? { ...c, quantity: targetQty } : c))
        : [...prev, { productId: selectedProductId, quantity: selectedQuantity }]
    );
    setSelectedQuantity(1);
  };

  const handleRemoveFromCart = (prodId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== prodId));
  };

  const subTotal = useMemo(
    () =>
      cart.reduce((acc, curr) => {
        const p = productById.get(curr.productId);
        return acc + (p ? p.salePrice * curr.quantity : 0);
      }, 0),
    [cart, productById]
  );

  const onValid = (data: SaleFormFields) => {
    if (cart.length === 0) {
      toast.error("Adicione pelo menos 1 produto ao carrinho de compras.");
      return;
    }

    const items: SaleItem[] = cart.map((item) => {
      const p = productById.get(item.productId)!;
      return { productId: item.productId, name: p.name, quantity: item.quantity, price: p.salePrice };
    });

    const client = data.clientChoice === WALK_IN ? undefined : clients.find((c) => c.id === data.clientChoice);

    startTransition(async () => {
      try {
        await registerSale({
          clientId: client?.id,
          clientName: client?.name ?? "Consumidor Final",
          clientDoc: client?.doc ?? "N/A",
          seller: data.seller,
          paymentMethod: data.paymentMethod,
          status: data.status,
          items,
        });
        toast.success("Venda registrada com sucesso!");
        onSuccess();
      } catch {
        toast.error("Erro ao registrar a venda. Tente novamente.");
      }
    });
  };

  const activeSelectedProduct = productById.get(selectedProductId);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        {/* Left: form */}
        <form onSubmit={handleSubmit(onValid)} className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand" />
              <h2 className="font-display text-lg font-semibold text-slate-900">Registrar Venda</h2>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Cliente</span>
              </label>
              <select
                {...register("clientChoice")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-all"
              >
                <option value={WALK_IN}>Consumidor Final (sem cadastro)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Status da Venda</span>
              </label>
              <select
                {...register("status")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-all"
              >
                <option value="Pago">Pago</option>
                <option value="Aguard. Retirada">Aguard. Retirada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Vendedor</span>
              </label>
              <select
                {...register("seller")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-all"
              >
                <option value="Marcos Silva">Marcos Silva (Gerente)</option>
                <option value="Balcão Auxiliar">Balcão Auxiliar 1</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>Meio de Pagamento</span>
              </label>
              <select
                {...register("paymentMethod")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-all"
              >
                <option value="Cartão Crédito">Cartão Crédito</option>
                <option value="PIX">PIX (Pix QR)</option>
                <option value="Dinheiro">Dinheiro (Espécie)</option>
                <option value="Debito">Cartão de Débito</option>
              </select>
            </div>
          </div>

          {/* Item selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <h4 className="text-xs font-bold text-slate-800 uppercase mb-3">Adicionar Itens do Catálogo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Produto</label>
                <div className="relative mb-1.5">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto por nome ou SKU..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={loadingData}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 outline-none disabled:opacity-60"
                >
                  {loadingData && <option value="">Carregando catálogo...</option>}
                  {!loadingData &&
                    productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) — {formatBRL(p.salePrice)}
                      </option>
                    ))}
                  {!loadingData && productOptions.length === 0 && (
                    <option value="">Nenhum produto encontrado</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd.</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 rounded-l-lg px-2 py-1 text-xs outline-none text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={loadingData}
                    className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand disabled:opacity-50 text-white px-3 py-1.5 rounded-r-lg font-bold text-xs transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>

            {activeSelectedProduct && (
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-500">
                  Estoque Disponível:{" "}
                  <strong className={isLow(activeSelectedProduct.stockLevel) ? "text-red-600" : "text-slate-800"}>
                    {activeSelectedProduct.stockLevel} unidades
                  </strong>
                </span>
                {isLow(activeSelectedProduct.stockLevel) && (
                  <span className="text-red-600 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Estoque Baixo!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-br from-brand to-brand-mid hover:from-brand-dark hover:to-brand disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-brand/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar Venda
            </button>
          </div>
        </form>

        {/* Right: basket */}
        <div className="bg-slate-50/80 md:w-80 p-6 md:p-8 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between overflow-y-auto max-h-[95vh]">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-800 border-b border-slate-200 pb-3 uppercase tracking-wider">
              Carrinho de Compras
            </h3>
            <div className="space-y-3.5 mt-4 max-h-64 overflow-y-auto pr-1">
              {cart.map((cartItem) => {
                const prod = productById.get(cartItem.productId);
                if (!prod) return null;
                return (
                  <div
                    key={cartItem.productId}
                    className="flex justify-between items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {cartItem.quantity} × {formatBRL(prod.salePrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(cartItem.productId)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                      title="Excluir item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-xs font-medium">O carrinho está vazio.</p>
                  <p className="text-[10px] text-slate-400 font-normal mt-1">Selecione produtos ao lado.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Subtotal</span>
                <span>{formatBRL(subTotal)}</span>
              </div>
              <div className="border-t border-dashed border-slate-200 my-2" />
              <div className="flex justify-between items-end text-sm font-black text-slate-900">
                <span>VALOR TOTAL</span>
                <span className="text-lg text-brand font-mono tabular-nums leading-none">{formatBRL(subTotal)}</span>
              </div>
            </div>
            <div className="bg-brand-tint text-brand px-3 py-2.5 rounded-lg text-[10px] font-semibold text-center border border-brand/5">
              Estoque será deduzido instantaneamente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
