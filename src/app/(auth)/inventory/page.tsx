import { getInventoryData } from "./_data-access/get-inventory-data";
import InventoryContent from "./_components/inventory-content";
import { getCurrentUserRole } from "@/lib/auth/get-current-role";

export default async function InventoryPage() {
  const [{ products, movements }, current] = await Promise.all([
    getInventoryData(),
    getCurrentUserRole(),
  ]);
  return (
    <InventoryContent
      products={products}
      movements={movements}
      role={current?.role ?? null}
    />
  );
}
