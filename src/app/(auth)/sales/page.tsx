import { getSales } from "./_data-access/get-sales";
import SalesContent from "./_components/sales-content";
import { getCurrentUserRole } from "@/lib/auth/get-current-role";

export default async function SalesPage() {
  const [sales, current] = await Promise.all([getSales(), getCurrentUserRole()]);
  return <SalesContent sales={sales} role={current?.role ?? null} />;
}
