import { Transaction } from "@mysten/sui/transactions";
import { isNaviMode } from "./config";

export type NaviPoolSummary = {
  apyPercent: number;
  utilizationBps: number;
  priceUsd: number;
};

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function naviFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body.slice(0, 120) || `NAVI API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchNaviPoolSummary(): Promise<NaviPoolSummary> {
  return naviFetch("/api/navi/pool");
}

export async function fetchNaviSuiSupplyMist(address: string): Promise<bigint> {
  const data = await naviFetch<{ supplyMist: string }>(
    `/api/navi/supply?address=${encodeURIComponent(address)}`,
  );
  try {
    const raw = data.supplyMist?.split(".")[0] ?? "0";
    return BigInt(raw || "0");
  } catch {
    return 0n;
  }
}

export async function buildNaviSmartSaveTx(
  totalMist: bigint,
  sender: string,
  vaultRatioBps: number,
): Promise<Transaction> {
  if (!isNaviMode()) {
    throw new Error("NAVI mode requires mainnet + ENABLE_NAVI=true");
  }

  const data = await naviFetch<{ txBytes: string }>("/api/navi/build-save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      totalMist: totalMist.toString(),
      vaultRatioBps,
      sender,
    }),
  });

  return Transaction.from(fromBase64(data.txBytes));
}

export async function buildNaviWithdrawTx(
  amountMist: bigint,
  sender: string,
): Promise<Transaction> {
  if (!isNaviMode()) {
    throw new Error("NAVI mode requires mainnet + ENABLE_NAVI=true");
  }

  const data = await naviFetch<{ txBytes: string }>("/api/navi/build-withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amountMist: amountMist.toString(),
      sender,
    }),
  });

  return Transaction.from(fromBase64(data.txBytes));
}
