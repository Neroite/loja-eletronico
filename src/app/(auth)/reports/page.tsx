import ReportsContent from "./_components/reports-content";
import { getReportsData } from "./_data-access/get-reports-data";

export default async function ReportsPage() {
  const data = await getReportsData();
  return <ReportsContent data={data} />;
}
