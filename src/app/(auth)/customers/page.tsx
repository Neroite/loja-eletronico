import { getClientsData } from "./_data-access/get-clients-data";
import CustomersContent from "./_components/customers-content";
import { getCurrentUserRole } from "@/lib/auth/get-current-role";

export default async function CustomersPage() {
  const [{ clients, sales }, current] = await Promise.all([
    getClientsData(),
    getCurrentUserRole(),
  ]);
  return (
    <CustomersContent clients={clients} sales={sales} role={current?.role ?? null} />
  );
}
