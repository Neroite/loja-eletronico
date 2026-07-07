"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InventoryView from "@/components/InventoryView";
import ProductModal from "@/components/ProductModal";
import StockMovementModal from "@/components/StockMovementModal";
import { useSearch } from "@/app/(auth)/_components/search-context";
import { deleteProduct } from "../_actions/delete-product";
import { bulkReplenish } from "../_actions/bulk-replenish";
import type { Role } from "@/lib/auth/roles";
import type { Product, StockMovement } from "@/types";

interface InventoryContentProps {
  products: Product[];
  movements: StockMovement[];
  role: Role | null;
}

export default function InventoryContent({ products, movements, role }: InventoryContentProps) {
  const router = useRouter();
  const { query } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [showProductModal, setShowProductModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const handleSuccess = () => {
    setShowProductModal(false);
    setEditProduct(undefined);
    router.refresh();
  };

  const handleDelete = (productId: string) => {
    startTransition(async () => {
      try {
        await deleteProduct(productId);
        toast.success("Produto removido do inventário.");
        router.refresh();
      } catch {
        toast.error("Erro ao remover o produto.");
      }
    });
  };

  const handleBulkReplenish = () => {
    startTransition(async () => {
      try {
        await bulkReplenish();
        toast.success("Reposição automática concluída.");
        router.refresh();
      } catch {
        toast.error("Erro na reposição automática.");
      }
    });
  };

  const productMovements = stockProduct
    ? movements.filter((m) => m.productId === stockProduct.id)
    : [];

  return (
    <>
      <InventoryView
        products={products}
        searchQuery={query}
        role={role}
        onOpenProductRegister={() => {
          setEditProduct(undefined);
          setShowProductModal(true);
        }}
        onEditProduct={(product) => {
          setEditProduct(product);
          setShowProductModal(true);
        }}
        onDeleteProduct={(productId) => {
          if (
            window.confirm(
              `Remover este produto do inventário? Ação irreversível.`
            )
          ) {
            handleDelete(productId);
          }
        }}
        onBulkReplenish={handleBulkReplenish}
        onOpenStock={setStockProduct}
      />

      {showProductModal && (
        <ProductModal
          product={editProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditProduct(undefined);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {stockProduct && (
        <StockMovementModal
          product={stockProduct}
          movements={productMovements}
          onClose={() => setStockProduct(null)}
          onSuccess={() => {
            setStockProduct(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
