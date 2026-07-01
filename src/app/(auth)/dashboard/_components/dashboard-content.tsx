"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalModal } from "@/components/modal-provider";
import DashboardView from "@/components/DashboardView";
import SaleDetailsModal from "@/components/SaleDetailsModal";
import type { Product, Sale, Client } from "@/types";

interface DashboardContentProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
}

export default function DashboardContent({ products, sales, clients }: DashboardContentProps) {
  const router = useRouter();
  const { open } = useGlobalModal();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  return (
    <>
      <DashboardView
        products={products}
        sales={sales}
        clients={clients}
        onNavigateToTab={(tab) => {
          if (tab === "settings") router.push("/settings");
          else router.push(`/${tab}`);
        }}
        onOpenNewSale={() => open("new-sale")}
        onViewSaleDetails={setSelectedSale}
      />
      {selectedSale && (
        <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </>
  );
}
