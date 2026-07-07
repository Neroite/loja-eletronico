"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SalesView from "@/components/SalesView";
import SaleDetailsModal from "@/components/SaleDetailsModal";
import { useSearch } from "@/app/(auth)/_components/search-context";
import { refundSale } from "../_actions/refund-sale";
import type { Role } from "@/lib/auth/roles";
import type { Sale } from "@/types";

interface SalesContentProps {
  sales: Sale[];
  role: Role | null;
}

export default function SalesContent({ sales, role }: SalesContentProps) {
  const router = useRouter();
  const { query } = useSearch();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRefund = (saleId: string) => {
    startTransition(async () => {
      try {
        await refundSale(saleId);
        toast.success("Venda estornada com sucesso.");
        router.refresh();
      } catch {
        toast.error("Erro ao estornar a venda. Tente novamente.");
      }
    });
  };

  return (
    <>
      <SalesView
        sales={sales}
        searchQuery={query}
        role={role}
        onViewSaleDetails={setSelectedSale}
        onRefundSale={handleRefund}
      />
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </>
  );
}
