"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchNaviPoolSummary,
  fetchNaviSuiSupplyMist,
} from "@/lib/navi";
import { isNaviMode } from "@/lib/config";

export function useNaviPool() {
  return useQuery({
    queryKey: ["navi-sui-pool"],
    queryFn: fetchNaviPoolSummary,
    enabled: isNaviMode(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useNaviSupply(address?: string) {
  return useQuery({
    queryKey: ["navi-supply", address],
    queryFn: () => fetchNaviSuiSupplyMist(address!),
    enabled: isNaviMode() && !!address,
    refetchInterval: 10_000,
  });
}

export function useNaviApy(): number | null {
  const { data: pool } = useNaviPool();
  if (!pool) return null;
  const apy = pool.apyPercent;
  return Number.isFinite(apy) ? apy : null;
}
