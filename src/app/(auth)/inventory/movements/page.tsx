import MovementsContent from "./_components/movements-content";
import { getMovements } from "../_data-access/get-movements";

export default async function MovementsPage() {
  const movements = await getMovements();
  return <MovementsContent movements={movements} />;
}
