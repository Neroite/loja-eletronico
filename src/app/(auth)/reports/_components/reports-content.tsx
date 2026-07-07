"use client";

import ReportsView from "@/components/ReportsView";
import type { ReportsData } from "../_data-access/get-reports-data";

interface ReportsContentProps {
  data: ReportsData;
}

// Boundary client do módulo: recharts só renderiza no cliente.
export default function ReportsContent({ data }: ReportsContentProps) {
  return <ReportsView data={data} />;
}
