"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useGlobalModal } from "@/components/modal-provider";
import NewSaleModal from "@/components/NewSaleModal";
import ProductModal from "@/components/ProductModal";
import NotificationsPanel from "./notifications-panel";
import { SearchProvider, useSearch } from "./search-context";
import type { LowStockProduct } from "../_data-access/get-header-data";

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Gestão da loja",
  "/sales": "Histórico de Vendas",
  "/inventory": "Gestão de Estoque",
  "/inventory/movements": "Movimentações de Estoque",
  "/customers": "Carteira de Clientes",
  "/reports": "Relatórios",
  "/settings": "Configurações da Loja",
};

interface AppShellProps {
  children: React.ReactNode;
  notificationsCount: number;
  lowStockProducts: LowStockProduct[];
  userEmail: string | null;
}

function AppShellInner({
  children,
  notificationsCount,
  lowStockProducts,
  userEmail,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeModal, close } = useGlobalModal();
  const { query, setQuery } = useSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const title = TITLE_MAP[pathname] ?? "ByteFlow Pro";
  // Dashboard e Relatórios têm filtros próprios — a busca global fica oculta neles.
  const showSearch = pathname !== "/dashboard" && pathname !== "/reports";

  const handleNotificationClick = (product: LowStockProduct) => {
    setNotificationsOpen(false);
    // O search context já filtra o InventoryView — cai direto no produto.
    setQuery(product.name);
    router.push("/inventory");
  };

  return (
    <>
      <div className="ml-0 lg:ml-64 flex flex-col min-h-screen">
        <Header
          searchQuery={query}
          setSearchQuery={setQuery}
          title={title}
          showSearch={showSearch}
          notificationsCount={notificationsCount}
          userEmail={userEmail}
          onMenuClick={() => setMobileMenuOpen((v) => !v)}
          onBellClick={() => setNotificationsOpen((v) => !v)}
        />
        {notificationsOpen && (
          <NotificationsPanel
            notifications={lowStockProducts}
            onItemClick={handleNotificationClick}
            onClose={() => setNotificationsOpen(false)}
          />
        )}
        <main className="flex-1 pt-16">{children}</main>
      </div>

      {activeModal === "new-sale" && (
        <NewSaleModal onClose={close} onSuccess={() => { close(); router.refresh(); }} />
      )}
      {activeModal === "new-product" && (
        <ProductModal onClose={close} onSuccess={() => { close(); router.refresh(); }} />
      )}

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default function AppShell({
  children,
  notificationsCount,
  lowStockProducts,
  userEmail,
}: AppShellProps) {
  return (
    <SearchProvider>
      <AppShellInner
        notificationsCount={notificationsCount}
        lowStockProducts={lowStockProducts}
        userEmail={userEmail}
      >
        {children}
      </AppShellInner>
    </SearchProvider>
  );
}
