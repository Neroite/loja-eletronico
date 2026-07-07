"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ClientsView from "@/components/ClientsView";
import ClientModal from "@/components/ClientModal";
import SaleDetailsModal from "@/components/SaleDetailsModal";
import { useSearch } from "@/app/(auth)/_components/search-context";
import { deleteClient } from "../_actions/delete-client";
import type { Role } from "@/lib/auth/roles";
import type { Client, Sale } from "@/types";

interface CustomersContentProps {
  clients: Client[];
  sales: Sale[];
  role: Role | null;
}

export default function CustomersContent({ clients, sales, role }: CustomersContentProps) {
  const router = useRouter();
  const { query } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [editClient, setEditClient] = useState<Client | undefined>();
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleSuccess = () => {
    setShowClientModal(false);
    setEditClient(undefined);
    router.refresh();
  };

  const handleDelete = (clientId: string) => {
    startTransition(async () => {
      try {
        await deleteClient(clientId);
        toast.success("Cliente removido da carteira.");
        router.refresh();
      } catch {
        toast.error("Erro ao remover o cliente.");
      }
    });
  };

  return (
    <>
      <ClientsView
        clients={clients}
        sales={sales}
        searchQuery={query}
        role={role}
        onOpenNewClient={() => {
          setEditClient(undefined);
          setShowClientModal(true);
        }}
        onEditClient={(client) => {
          setEditClient(client);
          setShowClientModal(true);
        }}
        onDeleteClient={handleDelete}
        onViewSaleDetails={setSelectedSale}
      />

      {showClientModal && (
        <ClientModal
          client={editClient}
          onClose={() => {
            setShowClientModal(false);
            setEditClient(undefined);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {selectedSale && (
        <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </>
  );
}
