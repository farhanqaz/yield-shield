"use client";

import { useEffect, useState } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { CONFIG, isConfigured } from "@/lib/config";

const RECEIPT_STORAGE_KEY = "yield-shield-receipt-id";

export function getStoredReceiptId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RECEIPT_STORAGE_KEY);
}

export function storeReceiptId(id: string) {
  localStorage.setItem(RECEIPT_STORAGE_KEY, id);
}

export function clearReceiptId() {
  localStorage.removeItem(RECEIPT_STORAGE_KEY);
}

function isShieldReceipt(type: string, packageId: string): boolean {
  return type.includes(`${packageId}::receipt::ShieldReceipt`);
}

export function useReceipt(owner: string | undefined) {
  const enabled = isConfigured() && !!owner;
  const [storedReceiptId, setStoredReceiptId] = useState<string | null>(null);

  useEffect(() => {
    setStoredReceiptId(getStoredReceiptId());
  }, [owner]);

  const query = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: owner!,
      filter: { Package: CONFIG.packageId },
      options: { showContent: true, showType: true },
    },
    { enabled, refetchInterval: 10_000 },
  );

  const onChainReceipt = query.data?.data?.find((obj) => {
    const type = obj.data?.type ?? "";
    return isShieldReceipt(type, CONFIG.packageId);
  });

  const receiptId = onChainReceipt?.data?.objectId ?? storedReceiptId;

  const shares = (() => {
    const content = onChainReceipt?.data?.content;
    if (!content || typeof content !== "object" || !("fields" in content)) {
      return BigInt(0);
    }
    const fields = (content as { fields: Record<string, unknown> }).fields;
    const raw = fields.shares;
    return raw !== undefined ? BigInt(String(raw)) : BigInt(0);
  })();

  return {
    ...query,
    receiptId,
    shares,
    hasReceipt: !!receiptId && shares > BigInt(0),
    refreshStoredReceipt: () => setStoredReceiptId(getStoredReceiptId()),
  };
}
