import { getInventoryData } from "./_data-access/get-inventory-data";
import InventoryContent from "./_components/inventory-content";

export default async function InventoryPage() {
  const { products, movements } = await getInventoryData();
  return <InventoryContent products={products} movements={movements} />;
}
