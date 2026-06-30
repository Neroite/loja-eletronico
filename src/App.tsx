import { useState, useMemo, useRef, useEffect } from "react";
import {
  CheckCircle,
  Sliders,
  Store,
  Package,
  Tag,
  Database,
  LogOut,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

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

// Auth & data layer
import LoginView from "./components/LoginView";
import { supabase } from "./lib/supabase";
import {
  fetchAllData,
  upsertProduct,
  upsertManyProducts,
  removeProduct,
  upsertClient,
  removeClient,
  insertSale,
  cancelSale,
  insertMovements,
  resetAllData,
} from "./lib/db";

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
  // Core datasets — persisted to localStorage via usePersistentState (fast initial
  // paint), then overwritten by Supabase data after login (Supabase is source of truth).
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

  // Store config (UI only) — stays in localStorage.
  const [storeName, setStoreName] = usePersistentState(
    "storeName",
    "ByteFlow Pro",
  );
  const [storeSegment, setStoreSegment] = usePersistentState(
    "storeSegment",
    "Eletrônicos & Informática",
  );

  // Auth & loading
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const replenishCount = useMemo(
    () => products.filter((p) => needsReplenish(p.stockLevel)).length,
    [products],
  );

  // ---------------------------------------------------------------------------
  // Toast helper
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Auth — get session on mount, subscribe to changes, fetch data on login.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchAllData()
          .then(({ products: p, clients: c, sales: s, movements: m }) => {
            setProducts(p);
            setClients(c);
            setSales(s);
            setMovements(m);
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        fetchAllData()
          .then(({ products: p, clients: c, sales: s2, movements: m }) => {
            setProducts(p);
            setClients(c);
            setSales(s2);
            setMovements(m);
          })
          .catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setMobileMenuOpen(false);
  };

  // Stamps movement entries with IDs (collision-safe against current state) and
  // appends them to the movements list. Returns stamped movements for DB sync.
  const recordMovements = (
    entries: Omit<StockMovement, "id" | "createdAt">[],
  ): StockMovement[] => {
    if (entries.length === 0) return [];
    const taken = movements.map((m) => m.id);
    const stamped: StockMovement[] = entries.map((e) => {
      const id = makeId("#MOV-", taken);
      taken.push(id);
      return { ...e, id, createdAt: new Date().toISOString() };
    });
    setMovements((prev) => [...stamped, ...prev]);
    return stamped;
  };

  const syncErr = () =>
    triggerToast("Aviso: erro ao sincronizar com o banco de dados.");

  // ---------------------------------------------------------------------------
  // 1. Transaction creation (Nova Venda)
  // ---------------------------------------------------------------------------

  const handleRegisterSale = (saleData: {
    clientId?: string;
    clientName: string;
    clientDoc: string;
    seller: string;
    paymentMethod: PaymentMethod;
    status: SaleStatus;
    items: SaleItem[];
  }) => {
    const productById = new Map(products.map((p) => [p.id, p]));

    const stamped = recordMovements(
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

    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = saleData.items.find(
          (item) => item.productId === prod.id,
        );
        if (!soldItem) return prod;
        const nextStock = Math.max(0, prod.stockLevel - soldItem.quantity);
        return { ...prod, stockLevel: nextStock, status: deriveStatus(nextStock) };
      }),
    );

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

    if (session) {
      const changedProducts = saleData.items
        .map((item) => {
          const prod = productById.get(item.productId);
          if (!prod) return null;
          const nextStock = Math.max(0, prod.stockLevel - item.quantity);
          return { ...prod, stockLevel: nextStock, status: deriveStatus(nextStock) };
        })
        .filter((p): p is Product => p !== null);
      Promise.all([
        insertSale(newSaleRecord),
        upsertManyProducts(changedProducts),
        stamped.length > 0 ? insertMovements(stamped) : Promise.resolve(),
      ]).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Refund / cancel a sale (estorno)
  // ---------------------------------------------------------------------------

  const handleRefundSale = (saleId: string) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    if (targetSale.status === "Cancelado") {
      triggerToast(`Venda ${saleId} já está cancelada.`);
      return;
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const orphanCount = targetSale.items.filter(
      (item) => !productById.has(item.productId),
    ).length;

    const stamped = recordMovements(
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
        return { ...prod, stockLevel: nextStock, status: deriveStatus(nextStock) };
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

    if (session) {
      const changedProducts = targetSale.items
        .map((item) => {
          const prod = productById.get(item.productId);
          if (!prod) return null;
          const nextStock = Math.min(prod.maxStock, prod.stockLevel + item.quantity);
          return { ...prod, stockLevel: nextStock, status: deriveStatus(nextStock) };
        })
        .filter((p): p is Product => p !== null);
      Promise.all([
        cancelSale(saleId),
        upsertManyProducts(changedProducts),
        stamped.length > 0 ? insertMovements(stamped) : Promise.resolve(),
      ]).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Product save/edit
  // ---------------------------------------------------------------------------

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

    if (session) {
      upsertProduct(productData).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Delete product
  // ---------------------------------------------------------------------------

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    triggerToast("Produto removido do catálogo de estoque.");

    if (session) {
      removeProduct(productId).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Bulk replenishment
  // ---------------------------------------------------------------------------

  const handleBulkReplenish = () => {
    const lowStockItems = products.filter((p) => needsReplenish(p.stockLevel));
    if (lowStockItems.length === 0) {
      triggerToast("Nenhum item abaixo do nível mínimo no momento.");
      return;
    }

    const stamped = recordMovements(
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
          ? { ...prod, stockLevel: prod.maxStock, status: deriveStatus(prod.maxStock) }
          : prod,
      ),
    );
    triggerToast(
      `Ordem de Compra emitida! ${lowStockItems.length} produtos repostos à capacidade máxima.`,
    );

    if (session) {
      const replenished = lowStockItems.map((prod) => ({
        ...prod,
        stockLevel: prod.maxStock,
        status: deriveStatus(prod.maxStock),
      }));
      Promise.all([
        upsertManyProducts(replenished),
        stamped.length > 0 ? insertMovements(stamped) : Promise.resolve(),
      ]).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Recalculate stock statuses
  // ---------------------------------------------------------------------------

  const handleRecalcStock = () => {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, status: deriveStatus(p.stockLevel) })),
    );
    triggerToast("Status do estoque recalculado conforme os níveis atuais.");

    if (session) {
      const recalced = products.map((p) => ({
        ...p,
        status: deriveStatus(p.stockLevel),
      }));
      upsertManyProducts(recalced).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 6b. Manual stock adjustment
  // ---------------------------------------------------------------------------

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

    const stamped = recordMovements([
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

    if (session) {
      const updated = {
        ...target,
        stockLevel: nextStock,
        status: deriveStatus(nextStock),
      };
      Promise.all([
        upsertProduct(updated),
        stamped.length > 0 ? insertMovements(stamped) : Promise.resolve(),
      ]).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. Client save/edit
  // ---------------------------------------------------------------------------

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

    if (session) {
      upsertClient(clientData).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. Delete client
  // ---------------------------------------------------------------------------

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    triggerToast("Cliente removido da carteira.");

    if (session) {
      removeClient(clientId).catch(syncErr);
    }
  };

  // ---------------------------------------------------------------------------
  // 9. Reset data back to demo seed
  // ---------------------------------------------------------------------------

  const handleResetData = () => {
    if (
      !window.confirm(
        "Restaurar os dados de demonstração? Todas as alterações (locais e no banco de dados) serão perdidas.",
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

    if (session) {
      resetAllData().catch(() =>
        triggerToast("Aviso: erro ao resetar o banco de dados."),
      );
    }
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
        return "Gestão da loja";
      case "sales":
        return "Histórico de Vendas";
      case "inventory":
        return "Gestão de Estoque";
      case "customers":
        return "Carteira de Clientes";
      case "settings":
        return "Configurações da Loja";
      default:
        return storeName;
    }
  };

  // ---------------------------------------------------------------------------
  // Auth gates — loading spinner and login screen before main app.
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  // ---------------------------------------------------------------------------
  // Main app
  // ---------------------------------------------------------------------------

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
                    <span>Dados</span>
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Restaura produtos, vendas e clientes para os dados de
                      demonstração, tanto localmente quanto no banco de dados.
                    </p>
                    <button
                      onClick={handleResetData}
                      className="shrink-0 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      Restaurar dados de demonstração
                    </button>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Account */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2 mb-3">
                    <LogOut className="w-4 h-4 text-brand" />
                    <span>Conta</span>
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500">
                      Conectado como{" "}
                      <span className="font-semibold text-slate-700">
                        {session.user.email}
                      </span>
                    </p>
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="shrink-0 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      Sair da conta
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
