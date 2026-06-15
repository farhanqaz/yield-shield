"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSuiUsdPrice } from "@/lib/pyth";

export function usePythPrice() {
  return useQuery({
    queryKey: ["pyth-sui-usd"],
    queryFn: fetchSuiUsdPrice,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
