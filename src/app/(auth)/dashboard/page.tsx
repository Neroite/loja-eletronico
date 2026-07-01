import { getDashboardData } from "./_data-access/get-dashboard-data";
import DashboardContent from "./_components/dashboard-content";

export default async function DashboardPage() {
  const { products, sales, clients } = await getDashboardData();
  return <DashboardContent products={products} sales={sales} clients={clients} />;
}
