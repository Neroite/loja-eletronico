import { useState, useMemo, useRef, useEffect } from "react";
import {
  CheckCircle,
  Sliders,
  Store,
  Package,
  Tag,
  Database,
} from "lucide-react";

// Custom core layouts
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import SalesView from "./components/SalesView";
import InventoryView from "./components/InventoryView";
import ClientsView from "./components/ClientsView";

// Modals
import NewSaleModal from "./components/NewSaleModal";
import ProductModal from "./components/ProductModal";
import SaleDetailsModal from "./components/SaleDetailsModal";
import ClientModal from "./components/ClientModal";
import StockMovementModal from "./components/StockMovementModal";

// Initial Data, Types & Helpers
import {
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_CLIENTS,
} from "./initialData";
import {
  Product,
  Sale,
  Client,
  SaleStatus,
  PaymentMethod,
  SaleItem,
  StockMovement,
} from "./types";
import { deriveStatus, needsReplenish, STOCK } from "./lib/stock";
import { makeId } from "./lib/id";
import {
  usePersistentState,
  clearPersistedState,
} from "./lib/usePersistentState";

type Tab = "dashboard" | "sales" | "inventory" | "customers" | "settings";

export default function App() {
  // Core datasets — persisted to localStorage (see usePersistentState). Swap this
  // hook for the Supabase data layer later; the handlers below stay unchanged.
  const [products, setProducts] = usePersistentState<Product[]>(
    "products",
    INITIAL_PRODUCTS,
  );
  const [sales, setSales] = usePersistentState<Sale[]>("sales", INITIAL_SALES);
  const [clients, setClients] = usePersistentState<Client[]>(
    "clients",
    INITIAL_CLIENTS,
  );
  const [movements, setMovements] = usePersistentState<StockMovement[]>(
    "movements",
    [],
  );

  // Store config (non-fiscal settings) — also persisted.
  const [storeName, setStoreName] = usePersistentState(
    "storeName",
    "ByteFlow Pro",
  );
  const [storeSegment, setStoreSegment] = usePersistentState(
    "storeSegment",
    "Eletrônicos & Informática",
  );

  // Layout states
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal controller states
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(
    undefined,
  );
  const [activeSaleDetails, setActiveSaleDetails] = useState<Sale | undefined>(
    undefined,
  );
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(
    undefined,
  );
  const [productForStock, setProductForStock] = useState<Product | undefined>(
    undefined,
  );

  // Notifications reflect a real signal: how many items need restocking.
  const replenishCount = useMemo(
    () => products.filter((p) => needsReplenish(p.stockLevel)).length,
    [products],
  );

  // Toast notification helper — a single shared timer so a new toast cannot be
  // wiped out early by a previous toast's pending timeout.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 4500);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery(""); // reset search on tab switches
    setMobileMenuOpen(false); // close the off-canvas drawer on mobile
  };

  // Append stock movements (most-recent first), assigning each a collision-free id.
  const recordMovements = (
    entries: Omit<StockMovement, "id" | "createdAt">[],
  ) => {
    if (entries.length === 0) return;
    setMovements((prev) => {
      const taken = prev.map((m) => m.id);
      const stamped: StockMovement[] = entries.map((e) => {
        const id = makeId("#MOV-", taken);
        taken.push(id);
        return { ...e, id, createdAt: new Date().toISOString() };
      });
      return [...stamped, ...prev];
    });
  };

  // 1. Transaction creation (Nova Venda)
  const handleRegisterSale = (saleData: {
    clientId?: string;
    clientName: string;
    clientDoc: string;
    seller: string;
    paymentMethod: PaymentMethod;
    status: SaleStatus;
    items: SaleItem[];
  }) => {
    // Record a 'venda' movement per sold item (computed from the current products snapshot).
    const productById = new Map(products.map((p) => [p.id, p]));
    recordMovements(
      saleData.items
        .filter((item) => productById.has(item.productId))
        .map((item) => {
          const prod = productById.get(item.productId)!;
          return {
            productId: prod.id,
            productName: prod.name,
            type: "venda" as const,
            delta: -item.quantity,
            resultingStock: Math.max(0, prod.stockLevel - item.quantity),
          };
        }),
    );

    // Deduct stock levels for selected items and re-derive their status
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = saleData.items.find(
          (item) => item.productId === prod.id,
        );
        if (!soldItem) return prod;
        const nextStock = Math.max(0, prod.stockLevel - soldItem.quantity);
        return {
          ...prod,
          stockLevel: nextStock,
          status: deriveStatus(nextStock),
        };
      }),
    );

    // Append to transactions list with a real timestamp and a collision-free id
    const newSaleRecord: Sale = {
      id: makeId(
        "#BF-",
        sales.map((s) => s.id),
      ),
      createdAt: new Date().toISOString(),
      clientId: saleData.clientId,
      clientName: saleData.clientName,
      clientDoc: saleData.clientDoc,
      seller: saleData.seller,
      paymentMethod: saleData.paymentMethod,
      totalValue: saleData.items.reduce(
        (acc, curr) => acc + curr.price * curr.quantity,
        0,
      ),
      status: saleData.status,
      items: saleData.items,
    };

    setSales((prev) => [newSaleRecord, ...prev]);
    setShowNewSaleModal(false);
    triggerToast(
      `Sucesso! Venda ${newSaleRecord.id} registrada e estoque atualizado.`,
    );
  };

  // 2. Refund / cancel a sale (estorno)
  const handleRefundSale = (saleId: string) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    // Guard against refunding the same sale twice (would double-restock).
    if (targetSale.status === "Cancelado") {
      triggerToast(`Venda ${saleId} já está cancelada.`);
      return;
    }

    // Items whose product was deleted from the catalog can't be restocked.
    const productById = new Map(products.map((p) => [p.id, p]));
    const orphanCount = targetSale.items.filter(
      (item) => !productById.has(item.productId),
    ).length;

    // Record an 'estorno' movement per restocked item (capped at maxStock, mirroring below).
    recordMovements(
      targetSale.items
        .filter((item) => productById.has(item.productId))
        .map((item) => {
          const prod = productById.get(item.productId)!;
          const resulting = Math.min(
            prod.maxStock,
            prod.stockLevel + item.quantity,
          );
          return {
            productId: prod.id,
            productName: prod.name,
            type: "estorno" as const,
            delta: resulting - prod.stockLevel,
            resultingStock: resulting,
          };
        }),
    );

    // Refund units back to corresponding products, capped at each box's capacity.
    setProducts((prev) =>
      prev.map((prod) => {
        const refundedItem = targetSale.items.find(
          (item) => item.productId === prod.id,
        );
        if (!refundedItem) return prod;
        const nextStock = Math.min(
          prod.maxStock,
          prod.stockLevel + refundedItem.quantity,
        );
        return {
          ...prod,
          stockLevel: nextStock,
          status: deriveStatus(nextStock),
        };
      }),
    );

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: "Cancelado" } : s)),
    );
    triggerToast(
      orphanCount > 0
        ? `Venda ${saleId} cancelada. ${orphanCount} item(ns) não repostos: produto removido do catálogo.`
        : `Venda ${saleId} cancelada. Produtos repostos no estoque.`,
    );
  };

  // 3. Product save/edit — isEdit is authoritative (the modal knows whether it opened
  // in edit mode), so a brand-new product can never silently overwrite an existing one.
  const handleSaveProduct = (productData: Product, isEdit: boolean) => {
    setProducts((prev) =>
      isEdit
        ? prev.map((p) => (p.id === productData.id ? productData : p))
        : [productData, ...prev],
    );
    triggerToast(
      isEdit
        ? `Produto ${productData.name} atualizado com sucesso.`
        : `Novo produto ${productData.name} adicionado ao catálogo.`,
    );
    setShowProductModal(false);
    setProductToEdit(undefined);
  };

  // 4. Delete product
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    triggerToast("Produto removido do catálogo de estoque.");
  };

  // 5. Bulk replenishment — restore each low item to its own box capacity (maxStock)
  const handleBulkReplenish = () => {
    const lowStockItems = products.filter((p) => needsReplenish(p.stockLevel));
    if (lowStockItems.length === 0) {
      triggerToast("Nenhum item abaixo do nível mínimo no momento.");
      return;
    }
    recordMovements(
      lowStockItems.map((prod) => ({
        productId: prod.id,
        productName: prod.name,
        type: "reposição" as const,
        delta: prod.maxStock - prod.stockLevel,
        resultingStock: prod.maxStock,
      })),
    );
    setProducts((prev) =>
      prev.map((prod) =>
        needsReplenish(prod.stockLevel)
          ? {
              ...prod,
              stockLevel: prod.maxStock,
              status: deriveStatus(prod.maxStock),
            }
          : prod,
      ),
    );
    triggerToast(
      `Ordem de Compra emitida! ${lowStockItems.length} produtos repostos à capacidade máxima.`,
    );
  };

  // 6. Recalculate stock statuses (e.g. after rule changes)
  const handleRecalcStock = () => {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, status: deriveStatus(p.stockLevel) })),
    );
    triggerToast("Status do estoque recalculado conforme os níveis atuais.");
  };

  // 6b. Manual stock adjustment (entrada/perda) — clamped to [0, maxStock], logged as a movement.
  const handleAdjustStock = (
    productId: string,
    delta: number,
    reason: string,
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target || delta === 0) return;
    const nextStock = Math.max(
      0,
      Math.min(target.maxStock, target.stockLevel + delta),
    );
    const realDelta = nextStock - target.stockLevel;
    if (realDelta === 0) {
      triggerToast(
        "Ajuste sem efeito: estoque já no limite (0 ou capacidade máxima).",
      );
      return;
    }
    recordMovements([
      {
        productId: target.id,
        productName: target.name,
        type: "ajuste",
        delta: realDelta,
        resultingStock: nextStock,
        reason: reason.trim() || undefined,
      },
    ]);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stockLevel: nextStock, status: deriveStatus(nextStock) }
          : p,
      ),
    );
    setProductForStock((prev) =>
      prev
        ? { ...prev, stockLevel: nextStock, status: deriveStatus(nextStock) }
        : prev,
    );
    triggerToast(
      `Estoque de ${target.name} ajustado em ${realDelta > 0 ? "+" : ""}${realDelta} (agora ${nextStock}).`,
    );
  };

  // 7. Client save/edit — isEdit authoritative (see handleSaveProduct).
  const handleSaveClient = (clientData: Client, isEdit: boolean) => {
    setClients((prev) =>
      isEdit
        ? prev.map((c) => (c.id === clientData.id ? clientData : c))
        : [clientData, ...prev],
    );
    triggerToast(
      isEdit
        ? `Cliente ${clientData.name} atualizado.`
        : `Cliente ${clientData.name} cadastrado com sucesso.`,
    );
    setShowClientModal(false);
    setClientToEdit(undefined);
  };

  // 8. Delete client
  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    triggerToast("Cliente removido da carteira.");
  };

  // 9. Reset persisted data back to the seed demo datasets.
  const handleResetData = () => {
    if (
      !window.confirm(
        "Restaurar os dados de demonstração? Todas as alterações locais (vendas, produtos e clientes) serão perdidas.",
      )
    ) {
      return;
    }
    clearPersistedState();
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setClients(INITIAL_CLIENTS);
    setMovements([]);
    setStoreName("ByteFlow Pro");
    setStoreSegment("Eletrônicos & Informática");
    triggerToast("Dados de demonstração restaurados.");
  };

  const openNewProduct = () => {
    setProductToEdit(undefined);
    setShowProductModal(true);
  };

  const openNewClient = () => {
    setClientToEdit(undefined);
    setShowClientModal(true);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Store ";
      case "sales":
        return "Gestão da loja";
      case "inventory":
        return "Gestão do Estoque";
      case "customers":
        return "Carteira de Clientes";
      case "settings":
        return "Configurações da Loja";
      default:
        return storeName;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800 font-sans selection:bg-brand/20">
      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-brand-ink text-white px-5 py-3.5 rounded-xl flex items-center gap-2.5 shadow-xl border border-slate-700 animate-slideIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Backdrop for the off-canvas sidebar on mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Global Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={goToTab}
        storeName={storeName}
        onOpenNewSale={() => {
          setShowNewSaleModal(true);
          setMobileMenuOpen(false);
        }}
        onOpenProductRegister={() => {
          openNewProduct();
          setMobileMenuOpen(false);
        }}
        mobileOpen={mobileMenuOpen}
      />

      {/* Core Body Container */}
      <div className="ml-0 lg:ml-64 flex flex-col min-h-screen relative">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          title={getHeaderTitle()}
          showSearch={activeTab !== "dashboard"}
          notificationsCount={replenishCount}
          onMenuClick={() => setMobileMenuOpen(true)}
          onBellClick={() => {
            goToTab("inventory");
            triggerToast(`${replenishCount} item(ns) precisam de reposição.`);
          }}
        />

        <main className="flex-1">
          {activeTab === "dashboard" && (
            <DashboardView
              sales={sales}
              products={products}
              clients={clients}
              onNavigateToTab={goToTab}
              onOpenNewSale={() => setShowNewSaleModal(true)}
              onViewSaleDetails={(sale) => setActiveSaleDetails(sale)}
            />
          )}

          {activeTab === "sales" && (
            <SalesView
              sales={sales}
              searchQuery={searchQuery}
              onViewSaleDetails={(sale) => setActiveSaleDetails(sale)}
              onRefundSale={handleRefundSale}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              products={products}
              searchQuery={searchQuery}
              onOpenProductRegister={openNewProduct}
              onEditProduct={(product) => {
                setProductToEdit(product);
                setShowProductModal(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onBulkReplenish={handleBulkReplenish}
              onRecalcStock={handleRecalcStock}
              onOpenStock={(product) => setProductForStock(product)}
            />
          )}

          {activeTab === "customers" && (
            <ClientsView
              clients={clients}
              sales={sales}
              searchQuery={searchQuery}
              onOpenNewClient={openNewClient}
              onEditClient={(client) => {
                setClientToEdit(client);
                setShowClientModal(true);
              }}
              onDeleteClient={handleDeleteClient}
              onViewSaleDetails={(sale) => setActiveSaleDetails(sale)}
            />
          )}

          {activeTab === "settings" && (
            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-brand-dark">
                  Configurações da Loja
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dados da loja e parâmetros de controle de estoque.
                </p>
              </div>

              <div className="bg-white border text-slate-700 rounded-2xl max-w-2xl mx-auto shadow-sm p-6 mt-2 space-y-6 border-slate-200">
                {/* Store identity */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2 mb-3">
                    <Store className="w-4 h-4 text-brand" />
                    <span>Identidade da Loja</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">
                        Nome da Loja
                      </label>
                      <input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">
                        Segmento
                      </label>
                      <input
                        value={storeSegment}
                        onChange={(e) => setStoreSegment(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Stock parameters */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2 mb-3">
                    <Sliders className="w-4 h-4 text-brand" />
                    <span>Parâmetros de Estoque</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800">
                        <strong>Estoque Baixo</strong> ao atingir{" "}
                        <strong>{STOCK.low}</strong> unidades ou menos.
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-red-600 shrink-0" />
                      <p className="text-xs text-red-800">
                        <strong>Crítico</strong> ao atingir{" "}
                        <strong>{STOCK.critical}</strong> unidades ou menos.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">
                    A "Ordem de Compra Automática" repõe cada item abaixo do
                    mínimo até a sua capacidade máxima (box).
                  </p>
                </div>

                <hr className="border-slate-100" />

                {/* Data management */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-brand" />
                    <span>Dados Locais</span>
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Vendas, produtos e clientes ficam salvos no navegador.
                      Restaure os dados de demonstração para começar do zero.
                    </p>
                    <button
                      onClick={handleResetData}
                      className="shrink-0 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      Restaurar dados de demonstração
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showNewSaleModal && (
        <NewSaleModal
          products={products}
          clients={clients}
          onClose={() => setShowNewSaleModal(false)}
          onRegisterSale={handleRegisterSale}
        />
      )}

      {showProductModal && (
        <ProductModal
          productToEdit={productToEdit}
          existingIds={products.map((p) => p.id)}
          onClose={() => {
            setShowProductModal(false);
            setProductToEdit(undefined);
          }}
          onSaveProduct={handleSaveProduct}
        />
      )}

      {activeSaleDetails && (
        <SaleDetailsModal
          sale={activeSaleDetails}
          onClose={() => setActiveSaleDetails(undefined)}
        />
      )}

      {showClientModal && (
        <ClientModal
          clientToEdit={clientToEdit}
          existingIds={clients.map((c) => c.id)}
          onClose={() => {
            setShowClientModal(false);
            setClientToEdit(undefined);
          }}
          onSaveClient={handleSaveClient}
        />
      )}

      {productForStock && (
        <StockMovementModal
          product={productForStock}
          movements={movements.filter(
            (m) => m.productId === productForStock.id,
          )}
          onAdjust={handleAdjustStock}
          onClose={() => setProductForStock(undefined)}
        />
      )}
    </div>
  );
}
