/**
 * Server-only NAVI helpers — import only from API routes / keeper.
 */
import {
  depositCoinPTB,
  getLendingState,
  getPool,
  withdrawCoinPTB,
  type Pool,
} from "@naviprotocol/lending";
import { Transaction } from "@mysten/sui/transactions";
import { CONFIG } from "./config";

const NAVI_ENV = "prod" as const;
const SUI_ASSET = "0x2::sui::SUI";

export async function fetchNaviSuiPool(): Promise<Pool> {
  return getPool(SUI_ASSET, { env: NAVI_ENV, market: "main" });
}

export function naviSupplyApyPercent(pool: Pool): number {
  const apy = pool.supplyIncentiveApyInfo?.apy;
  if (apy == null) return 0;
  const n = typeof apy === "string" ? parseFloat(apy) : Number(apy);
  return n * 100;
}

export function naviUtilizationBps(pool: Pool): number {
  const supply = Number(pool.totalSupply ?? pool.totalSupplyAmount ?? 0);
  const borrow = Number(pool.totalBorrow ?? pool.borrowedAmount ?? 0);
  if (supply <= 0) return 2000;
  return Math.min(10_000, Math.floor((borrow / supply) * 10_000));
}

export async function fetchNaviSuiSupplyMist(
  address: string,
): Promise<bigint> {
  const state = await getLendingState(address, { env: NAVI_ENV });
  const sui = state.find(
    (p) =>
      p.pool.token?.symbol === "SUI" ||
      p.pool.suiCoinType?.includes("sui::SUI"),
  );
  if (!sui?.supplyBalance) return 0n;
  return BigInt(sui.supplyBalance);
}

export async function buildNaviSmartSaveTx(
  totalMist: bigint,
  sender: string,
  vaultRatioBps: number,
): Promise<Transaction> {
  const vaultAmount = (totalMist * BigInt(vaultRatioBps)) / 10000n;
  const liquidAmount = totalMist - vaultAmount;

  const tx = new Transaction();
  tx.setSender(sender);

  if (liquidAmount > 0n) {
    const [vaultCoin, liquidCoin] = tx.splitCoins(tx.gas, [
      vaultAmount,
      liquidAmount,
    ]);
    await depositCoinPTB(tx, CONFIG.coinType, vaultCoin, {
      amount: Number(vaultAmount),
      env: NAVI_ENV,
      market: "main",
    });
    tx.transferObjects([liquidCoin], sender);
  } else {
    const [vaultCoin] = tx.splitCoins(tx.gas, [vaultAmount]);
    await depositCoinPTB(tx, CONFIG.coinType, vaultCoin, {
      amount: Number(vaultAmount),
      env: NAVI_ENV,
      market: "main",
    });
  }

  return tx;
}

export async function buildNaviWithdrawTx(
  amountMist: bigint,
  sender: string,
): Promise<Transaction> {
  const tx = new Transaction();
  tx.setSender(sender);
  const withdrawn = await withdrawCoinPTB(
    tx,
    CONFIG.coinType,
    Number(amountMist),
    { env: NAVI_ENV, market: "main" },
  );
  tx.transferObjects([withdrawn], sender);
  return tx;
}
