/** Client-side cost basis for PNL (vault / NAVI deposits per wallet). */

export type PortfolioLedger = {
  depositedMist: string;
  withdrawnMist: string;
  updatedAt: number;
};

const prefix = "yield-shield-ledger:";

function key(address: string) {
  return `${prefix}${address.toLowerCase()}`;
}

export function loadLedger(address: string): PortfolioLedger {
  if (typeof window === "undefined") {
    return { depositedMist: "0", withdrawnMist: "0", updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(key(address));
    if (!raw) return { depositedMist: "0", withdrawnMist: "0", updatedAt: 0 };
    const parsed = JSON.parse(raw) as PortfolioLedger;
    return {
      depositedMist: parsed.depositedMist ?? "0",
      withdrawnMist: parsed.withdrawnMist ?? "0",
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch {
    return { depositedMist: "0", withdrawnMist: "0", updatedAt: 0 };
  }
}

export function saveLedger(address: string, ledger: PortfolioLedger) {
  localStorage.setItem(
    key(address),
    JSON.stringify({ ...ledger, updatedAt: Date.now() }),
  );
}

export function recordYieldDeposit(address: string, mist: bigint) {
  if (mist <= 0n) return;
  const ledger = loadLedger(address);
  const deposited = BigInt(ledger.depositedMist) + mist;
  saveLedger(address, {
    ...ledger,
    depositedMist: deposited.toString(),
  });
}

export function recordYieldWithdraw(address: string, mist: bigint) {
  if (mist <= 0n) return;
  const ledger = loadLedger(address);
  const withdrawn = BigInt(ledger.withdrawnMist) + mist;
  saveLedger(address, {
    ...ledger,
    withdrawnMist: withdrawn.toString(),
  });
}

export function netDeployedMist(ledger: PortfolioLedger): bigint {
  const d = BigInt(ledger.depositedMist);
  const w = BigInt(ledger.withdrawnMist);
  return d > w ? d - w : 0n;
}
