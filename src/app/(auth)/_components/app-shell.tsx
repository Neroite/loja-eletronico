"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useGlobalModal } from "@/components/modal-provider";
import NewSaleModal from "@/components/NewSaleModal";
import ProductModal from "@/components/ProductModal";
import { SearchProvider, useSearch } from "./search-context";

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Gestão da loja",
  "/sales": "Histórico de Vendas",
  "/inventory": "Gestão de Estoque",
  "/customers": "Carteira de Clientes",
  "/settings": "Configurações da Loja",
};

interface AppShellProps {
  children: React.ReactNode;
  notificationsCount: number;
  userEmail: string | null;
}

function AppShellInner({ children, notificationsCount, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeModal, close } = useGlobalModal();
  const { query, setQuery } = useSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title = TITLE_MAP[pathname] ?? "ByteFlow Pro";
  const showSearch = pathname !== "/dashboard";

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
          onBellClick={() => router.push("/inventory")}
        />
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

export default function AppShell({ children, notificationsCount, userEmail }: AppShellProps) {
  return (
    <SearchProvider>
      <AppShellInner notificationsCount={notificationsCount} userEmail={userEmail}>
        {children}
      </AppShellInner>
    </SearchProvider>
  );
}
