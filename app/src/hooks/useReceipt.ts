"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
import { CONFIG, isConfigured } from "@/lib/config";

export type VaultReceipt = {
  id: string;
  shares: bigint;
};

function receiptStorageKey(owner: string) {
  return `yield-shield-receipt-id:${owner}`;
}

export function getStoredReceiptId(owner?: string): string | null {
  if (typeof window === "undefined" || !owner) return null;
  return localStorage.getItem(receiptStorageKey(owner));
}

export function storeReceiptId(owner: string, id: string) {
  localStorage.setItem(receiptStorageKey(owner), id);
}

export function clearReceiptId(owner?: string) {
  if (typeof window === "undefined" || !owner) return;
  localStorage.removeItem(receiptStorageKey(owner));
}

function isShieldReceipt(type: string): boolean {
  return type.includes("ShieldReceipt");
}

function parseReceipt(
  objectId: string,
  content: unknown,
  vaultId: string,
): VaultReceipt | null {
  if (!content || typeof content !== "object" || !("fields" in content)) {
    return null;
  }
  const fields = (content as { fields: Record<string, unknown> }).fields;
  const receiptVault = String(fields.vault_id ?? "");
  if (receiptVault && receiptVault !== vaultId) return null;
  const raw = fields.shares;
  if (raw === undefined || raw === null) return null;
  try {
    const shares = BigInt(String(raw));
    return { id: objectId, shares };
  } catch {
    return null;
  }
}

async function fetchAllReceipts(
  client: SuiClient,
  owner: string,
): Promise<VaultReceipt[]> {
  const receipts: VaultReceipt[] = [];
  let cursor: string | null | undefined = null;
  let hasNext = true;

  while (hasNext) {
    const page = await client.getOwnedObjects({
      owner,
      cursor: cursor ?? undefined,
      filter: { Package: CONFIG.packageId },
      options: { showContent: true, showType: true },
    });

    for (const obj of page.data) {
      const type = obj.data?.type ?? "";
      if (!isShieldReceipt(type) || !obj.data?.objectId) continue;
      const parsed = parseReceipt(
        obj.data.objectId,
        obj.data.content,
        CONFIG.vaultId,
      );
      if (parsed && parsed.shares > 0n) {
        receipts.push(parsed);
      }
    }

    hasNext = page.hasNextPage;
    cursor = page.nextCursor ?? null;
    if (!hasNext) break;
  }

  return receipts.sort((a, b) => (a.shares > b.shares ? -1 : 1));
}

export function useReceipt(owner: string | undefined) {
  const client = useSuiClient();
  const enabled = isConfigured() && !!owner;
  const [receipts, setReceipts] = useState<VaultReceipt[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const ownedQuery = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: owner!,
      filter: { Package: CONFIG.packageId },
      options: { showContent: true, showType: true },
    },
    { enabled, refetchInterval: 6_000 },
  );

  const syncReceiptFromChain = useCallback(async () => {
    if (!owner) return [] as VaultReceipt[];
    setIsSyncing(true);
    try {
      const found = await fetchAllReceipts(client, owner);
      setReceipts(found);
      if (found[0]) {
        storeReceiptId(owner, found[0].id);
      }
      return found;
    } finally {
      setIsSyncing(false);
    }
  }, [client, owner]);

  useEffect(() => {
    if (!ownedQuery.data?.data || !owner) return;
    const parsed: VaultReceipt[] = [];
    for (const obj of ownedQuery.data.data) {
      const type = obj.data?.type ?? "";
      if (!isShieldReceipt(type) || !obj.data?.objectId) continue;
      const receipt = parseReceipt(
        obj.data.objectId,
        obj.data.content,
        CONFIG.vaultId,
      );
      if (receipt && receipt.shares > 0n) {
        parsed.push(receipt);
      }
    }
    parsed.sort((a, b) => (a.shares > b.shares ? -1 : 1));
    setReceipts(parsed);
    if (parsed[0]) {
      storeReceiptId(owner, parsed[0].id);
    }
  }, [ownedQuery.data, owner]);

  useEffect(() => {
    if (!enabled || !owner) return;
    void (async () => {
      const found = await fetchAllReceipts(client, owner);
      setReceipts(found);
      if (found[0]) storeReceiptId(owner, found[0].id);
    })();
  }, [enabled, owner, client]);

  const totalShares = useMemo(
    () => receipts.reduce((sum, r) => sum + r.shares, 0n),
    [receipts],
  );

  const primaryReceipt = receipts[0] ?? null;

  return {
    receipts,
    receiptId: primaryReceipt?.id ?? null,
    shares: totalShares,
    hasPosition: totalShares > 0n,
    isLoading: ownedQuery.isPending || isSyncing,
    refreshReceipt: syncReceiptFromChain,
    syncReceiptFromChain,
  };
}
