import { getSales } from "./_data-access/get-sales";
import SalesContent from "./_components/sales-content";

export default async function SalesPage() {
  const sales = await getSales();
  return <SalesContent sales={sales} />;
}
