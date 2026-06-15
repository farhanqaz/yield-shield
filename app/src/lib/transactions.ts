import { Transaction } from "@mysten/sui/transactions";
import { CONFIG } from "./config";

type TxBase = {
  packageId?: string;
  vaultId?: string;
  coinType?: string;
};

function pkg({ packageId = CONFIG.packageId }: TxBase) {
  return packageId;
}

/** First deposit — mints ShieldReceipt and transfers to sender. */
export function buildDepositTx(
  amountMist: bigint,
  sender: string,
  opts: TxBase = {},
): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);

  const [receipt] = tx.moveCall({
    target: `${pkg(opts)}::vault::deposit`,
    typeArguments: [coinType],
    arguments: [tx.object(opts.vaultId ?? CONFIG.vaultId), coin],
  });

  tx.transferObjects([receipt], sender);
  return tx;
}

/** Add to existing receipt. */
export function buildDepositIntoReceiptTx(
  amountMist: bigint,
  receiptId: string,
  opts: TxBase = {},
): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);

  tx.moveCall({
    target: `${pkg(opts)}::vault::deposit_into_receipt`,
    typeArguments: [coinType],
    arguments: [
      tx.object(opts.vaultId ?? CONFIG.vaultId),
      tx.object(receiptId),
      coin,
    ],
  });

  return tx;
}

/** Withdraw shares — returns coin to sender. */
export function buildWithdrawTx(
  shares: bigint,
  receiptId: string,
  sender: string,
  opts: TxBase = {},
): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;

  const coin = tx.moveCall({
    target: `${pkg(opts)}::vault::withdraw`,
    typeArguments: [coinType],
    arguments: [
      tx.object(opts.vaultId ?? CONFIG.vaultId),
      tx.object(receiptId),
      tx.pure.u64(shares),
    ],
  });

  tx.transferObjects([coin], sender);
  return tx;
}

/** Withdraw all shares from multiple receipts in one PTB. */
export function buildWithdrawAllTx(
  items: { receiptId: string; shares: bigint }[],
  sender: string,
  opts: TxBase = {},
): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;
  const active = items.filter((i) => i.shares > 0n);
  if (active.length === 0) {
    throw new Error("No vault shares to withdraw");
  }

  const coins = active.map((item) =>
    tx.moveCall({
      target: `${pkg(opts)}::vault::withdraw`,
      typeArguments: [coinType],
      arguments: [
        tx.object(opts.vaultId ?? CONFIG.vaultId),
        tx.object(item.receiptId),
        tx.pure.u64(item.shares),
      ],
    }),
  );

  const [primary, ...rest] = coins;
  if (rest.length > 0) {
    tx.mergeCoins(primary, rest);
  }
  tx.transferObjects([primary], sender);
  return tx;
}

/** Admin demo: spike risk metrics → vault pauses deposits. */
export function buildStressTx(opts: TxBase = {}): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;
  const adminCapId = CONFIG.adminCapId;

  if (!adminCapId) {
    throw new Error("NEXT_PUBLIC_ADMIN_CAP_ID not set");
  }

  tx.moveCall({
    target: `${pkg(opts)}::vault::update_metrics`,
    typeArguments: [coinType],
    arguments: [
      tx.object(adminCapId),
      tx.object(opts.vaultId ?? CONFIG.vaultId),
      tx.pure.u64(9500), // 95% utilization
      tx.pure.u64(4000), // high volatility bps
      tx.pure.u64(1000), // low health buffer
    ],
  });

  return tx;
}

/** Reset metrics to safe defaults (admin demo). */
export function buildResetMetricsTx(opts: TxBase = {}): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;

  tx.moveCall({
    target: `${pkg(opts)}::vault::update_metrics`,
    typeArguments: [coinType],
    arguments: [
      tx.object(CONFIG.adminCapId),
      tx.object(opts.vaultId ?? CONFIG.vaultId),
      tx.pure.u64(2000),
      tx.pure.u64(500),
      tx.pure.u64(8000),
    ],
  });

  return tx;
}

/** Keeper: push Pyth-derived volatility on-chain (admin PTB). */
export function buildSyncPythMetricsTx(
  volatilityBps: number,
  utilizationBps = 2000,
  healthBufferBps = 8000,
  opts: TxBase = {},
): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;

  if (!CONFIG.adminCapId) {
    throw new Error("NEXT_PUBLIC_ADMIN_CAP_ID not set");
  }

  tx.moveCall({
    target: `${pkg(opts)}::vault::update_metrics`,
    typeArguments: [coinType],
    arguments: [
      tx.object(CONFIG.adminCapId),
      tx.object(opts.vaultId ?? CONFIG.vaultId),
      tx.pure.u64(utilizationBps),
      tx.pure.u64(volatilityBps),
      tx.pure.u64(healthBufferBps),
    ],
  });

  return tx;
}

/** One-time: create shared vault + AdminCap for deployer. */
export function buildCreateVaultTx(opts: TxBase = {}): Transaction {
  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;

  tx.moveCall({
    target: `${pkg(opts)}::vault::create_vault`,
    typeArguments: [coinType],
    arguments: [],
  });

  return tx;
}
