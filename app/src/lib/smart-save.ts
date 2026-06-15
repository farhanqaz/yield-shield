import { Transaction } from "@mysten/sui/transactions";
import type { TransactionObjectArgument } from "@mysten/sui/transactions";
import { CONFIG, isNaviMode } from "./config";
import { buildNaviSmartSaveTx } from "./navi";

type TxBase = {
  packageId?: string;
  vaultId?: string;
  coinType?: string;
};

function pkg({ packageId = CONFIG.packageId }: TxBase) {
  return packageId;
}

/** Keep headroom on the gas coin for PTB fees (mist). */
export const SMART_SAVE_GAS_BUFFER_MIST = 20_000_000n; // 0.02 SUI

/**
 * Programmable Save — one PTB splits incoming funds and routes to vault/NAVI + liquid buffer.
 * NAVI mode (mainnet): vault % → NAVI lending yield. Testnet: Yield Shield vault contract.
 */
export async function buildSmartSaveTx(
  totalMist: bigint,
  sender: string,
  opts: TxBase & { vaultRatioBps?: number; receiptId?: string } = {},
): Promise<Transaction> {
  const ratio = opts.vaultRatioBps ?? CONFIG.smartSaveVaultBps ?? 8500;

  if (isNaviMode()) {
    return buildNaviSmartSaveTx(totalMist, sender, ratio);
  }

  return buildVaultSmartSaveTx(totalMist, sender, { ...opts, vaultRatioBps: ratio });
}

function buildVaultSmartSaveTx(
  totalMist: bigint,
  sender: string,
  opts: TxBase & { vaultRatioBps: number; receiptId?: string },
): Transaction {
  const vaultAmount = (totalMist * BigInt(opts.vaultRatioBps)) / 10000n;
  const liquidAmount = totalMist - vaultAmount;

  const tx = new Transaction();
  const coinType = opts.coinType ?? CONFIG.coinType;

  if (liquidAmount > 0n) {
    const [vaultCoin, liquidCoin] = tx.splitCoins(tx.gas, [
      vaultAmount,
      liquidAmount,
    ]);
    depositVaultCoin(tx, vaultCoin, sender, coinType, opts);
    tx.transferObjects([liquidCoin], sender);
  } else {
    const [vaultCoin] = tx.splitCoins(tx.gas, [vaultAmount]);
    depositVaultCoin(tx, vaultCoin, sender, coinType, opts);
  }

  return tx;
}

function depositVaultCoin(
  tx: Transaction,
  vaultCoin: TransactionObjectArgument,
  sender: string,
  coinType: string,
  opts: TxBase & { receiptId?: string },
) {
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
    return;
  }

  const receipt = tx.moveCall({
    target: `${pkg(opts)}::vault::deposit`,
    typeArguments: [coinType],
    arguments: [tx.object(opts.vaultId ?? CONFIG.vaultId), vaultCoin],
  });
  tx.transferObjects([receipt], sender);
}
