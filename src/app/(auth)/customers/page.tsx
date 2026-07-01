import { getClientsData } from "./_data-access/get-clients-data";
import CustomersContent from "./_components/customers-content";

export default async function CustomersPage() {
  const { clients, sales } = await getClientsData();
  return <CustomersContent clients={clients} sales={sales} />;
}
