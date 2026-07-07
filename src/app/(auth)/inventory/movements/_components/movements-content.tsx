"use client";

import MovementsView from "@/components/MovementsView";
import { useSearch } from "@/app/(auth)/_components/search-context";
import type { StockMovement } from "@/types";

interface MovementsContentProps {
  movements: StockMovement[];
}

export default function MovementsContent({ movements }: MovementsContentProps) {
  const { query } = useSearch();
  return <MovementsView movements={movements} searchQuery={query} />;
}
