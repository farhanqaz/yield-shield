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

/**
 * Programmable Save — one PTB splits incoming funds and routes to vault + liquid buffer.
 * Matches DeFi & Payments track: "payment that automatically invests" with guardrails.
 */
export function buildSmartSaveTx(
  totalMist: bigint,
  sender: string,
  opts: TxBase & { vaultRatioBps?: number; receiptId?: string } = {},
): Transaction {
  const ratio = opts.vaultRatioBps ?? 8500; // 85% guarded yield, 15% liquid
  const vaultAmount = (totalMist * BigInt(ratio)) / 10000n;
  const liquidAmount = totalMist - vaultAmount;

  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;

  const [coin] = tx.splitCoins(tx.gas, [totalMist]);
  const [vaultCoin, liquidCoin] = tx.splitCoins(coin, [vaultAmount, liquidAmount]);

  if (opts.receiptId) {
    tx.moveCall({
      target: `${pkg(opts)}::vault::deposit_into_receipt`,
      typeArguments: [coinType],
      arguments: [
        tx.object(opts.vaultId ?? CONFIG.vaultId),
        tx.object(opts.receiptId),
        vaultCoin,
      ],
    });
  } else {
    const [receipt] = tx.moveCall({
      target: `${pkg(opts)}::vault::deposit`,
      typeArguments: [coinType],
      arguments: [tx.object(opts.vaultId ?? CONFIG.vaultId), vaultCoin],
    });
    tx.transferObjects([receipt], sender);
  }

  if (liquidAmount > 0n) {
    tx.transferObjects([liquidCoin], sender);
  } else {
    tx.transferObjects([liquidCoin], sender);
  }

  return tx;
}
