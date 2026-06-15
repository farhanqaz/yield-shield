"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { CONFIG, ShieldStatusCode, SHIELD_STATUS, isConfigured } from "@/lib/config";

export type VaultState = {
  score: number;
  status: ShieldStatusCode;
  totalShares: bigint;
  supplied: bigint;
  utilizationBps: bigint;
};

function parseU64(value: string | number | undefined): bigint {
  if (value === undefined) return 0n;
  return BigInt(value);
}

function parseVaultContent(content: unknown): VaultState | null {
  if (!content || typeof content !== "object") return null;
  const c = content as { dataType?: string; fields?: Record<string, unknown> };
  if (c.dataType !== "moveObject" || !c.fields) return null;

  const f = c.fields;
  const status = Number(f.status ?? 0) as ShieldStatusCode;

  return {
    score: Number(f.score ?? 0),
    status: status in SHIELD_STATUS ? status : 0,
    totalShares: parseU64(f.total_shares as string),
    supplied: parseU64(f.supplied as string),
    utilizationBps: parseU64(f.utilization_bps as string),
  };
}

export function useVault() {
  const enabled = isConfigured();

  const query = useSuiClientQuery(
    "getObject",
    {
      id: CONFIG.vaultId,
      options: { showContent: true },
    },
    {
      enabled,
      refetchInterval: 5_000,
    },
  );

  const vault =
    query.data?.data?.content &&
    parseVaultContent(query.data.data.content);

  return { ...query, vault, enabled };
}
