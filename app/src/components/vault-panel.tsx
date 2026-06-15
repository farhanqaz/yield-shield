"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CONFIG, MIST_PER_SUI, isConfigured, showDemoControls } from "@/lib/config";
import {
  buildResetMetricsTx,
  buildStressTx,
  buildSyncPythMetricsTx,
  buildWithdrawAmountTx,
} from "@/lib/transactions";
import { volatilityBpsFromPrices } from "@/lib/pyth";
import { EXPLORER } from "@/lib/explorer";
import { buildSmartSaveTx, SMART_SAVE_GAS_BUFFER_MIST } from "@/lib/smart-save";
import { useReceipt, storeReceiptId, clearReceiptId } from "@/hooks/useReceipt";
import { usePythPrice } from "@/hooks/usePythPrice";
import { useVault } from "@/hooks/useVault";
import { SHIELD_STATUS } from "@/lib/config";

const PYTH_REF_KEY = "yield-shield-pyth-ref-usd";

function findCreatedReceiptId(
  objectChanges: Array<{
    type?: string;
    objectType?: string;
    objectId?: string;
  }> | undefined,
): string | null {
  if (!objectChanges) return null;
  for (const change of objectChanges) {
    const type = change.type ?? "";
    const objectType = change.objectType ?? "";
    if (
      (type === "created" || type === "mutated") &&
      objectType.includes("ShieldReceipt") &&
      change.objectId
    ) {
      return change.objectId;
    }
  }
  return null;
}

function formatSui(mist: bigint): string {
  const n = Number(mist) / Number(MIST_PER_SUI);
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toFixed(4).replace(/\.?0+$/, (m) => (m === "." ? "" : m));
}

function mistFromInput(value: string): bigint | null {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return BigInt(Math.floor(n * Number(MIST_PER_SUI)));
}

export function VaultPanel({
  defaultAmount = "0.1",
  paymentLink = false,
}: {
  defaultAmount?: string;
  paymentLink?: boolean;
}) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const { vault, isPending: vaultLoading } = useVault();
  const {
    receipts,
    receiptId,
    shares,
    hasPosition,
    refreshReceipt,
    syncReceiptFromChain,
  } = useReceipt(account?.address);
  const { data: pyth } = usePythPrice();

  const { data: walletBalance } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "" },
    { enabled: !!account },
  );

  const [depositAmount, setDepositAmount] = useState(defaultAmount);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [pythRefUsd, setPythRefUsd] = useState<number | null>(null);

  useEffect(() => {
    setDepositAmount(defaultAmount);
  }, [defaultAmount]);

  useEffect(() => {
    const stored = localStorage.getItem(PYTH_REF_KEY);
    if (stored) setPythRefUsd(parseFloat(stored));
  }, []);

  useEffect(() => {
    if (pyth?.priceUsd && pythRefUsd === null) {
      localStorage.setItem(PYTH_REF_KEY, String(pyth.priceUsd));
      setPythRefUsd(pyth.priceUsd);
    }
  }, [pyth?.priceUsd, pythRefUsd]);

  const configured = isConfigured();
  const depositsBlocked = vault?.status === 2;
  const score = vault?.score ?? 100;
  const status = (vault?.status ?? 0) as 0 | 1 | 2;
  const statusLabel = SHIELD_STATUS[status].label;
  const statusColor = SHIELD_STATUS[status].color;
  const demoControls = showDemoControls();

  const walletMist = walletBalance ? BigInt(walletBalance.totalBalance) : 0n;
  const spendableMist =
    walletMist > SMART_SAVE_GAS_BUFFER_MIST
      ? walletMist - SMART_SAVE_GAS_BUFFER_MIST
      : 0n;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sui-client"] });
  };

  const runTx = (
    build: () => ReturnType<typeof buildSmartSaveTx>,
    onSuccess?: (
      digest: string,
      objectChanges?: Parameters<typeof findCreatedReceiptId>[0],
    ) => void,
  ) => {
    if (!account) return;
    setError(null);
    setTxDigest(null);
    setTxStatus("Confirm in wallet…");

    signAndExecute(
      { transaction: build() },
      {
        onSuccess: async (result) => {
          setTxDigest(result.digest);
          setTxStatus("Done");

          let objectChanges: Parameters<typeof findCreatedReceiptId>[0];
          try {
            const details = await client.getTransactionBlock({
              digest: result.digest,
              options: { showObjectChanges: true },
            });
            objectChanges = details.objectChanges as Parameters<
              typeof findCreatedReceiptId
            >[0];
          } catch {
            objectChanges = undefined;
          }

          onSuccess?.(result.digest, objectChanges);
          invalidate();
          void refreshReceipt();
        },
        onError: (e) => {
          setError(
            e.message === "Unexpected error"
              ? "Failed — keep ~0.02 SUI for gas and try a smaller amount."
              : e.message,
          );
          setTxStatus(null);
        },
      },
    );
  };

  const handleDeposit = async () => {
    if (!account) return;
    const mist = mistFromInput(depositAmount);
    if (!mist) {
      setError("Enter a valid amount");
      return;
    }
    if (mist + SMART_SAVE_GAS_BUFFER_MIST > walletMist) {
      setError("Not enough SUI (reserve ~0.02 for gas)");
      return;
    }

    runTx(
      () =>
        buildSmartSaveTx(mist, account.address, {
          vaultRatioBps: CONFIG.smartSaveVaultBps,
          receiptId: receiptId ?? undefined,
        }),
      async (_digest, objectChanges) => {
        let id = findCreatedReceiptId(objectChanges);
        if (!id) {
          const synced = await syncReceiptFromChain();
          id = synced[0]?.id ?? null;
        }
        if (id) {
          storeReceiptId(account.address, id);
          await refreshReceipt();
        }
      },
    );
  };

  const handleWithdraw = async () => {
    if (!account) return;
    setError(null);

    const mist = mistFromInput(withdrawAmount);
    if (!mist) {
      setError("Enter a valid amount");
      return;
    }

    const active = receipts.length > 0 ? receipts : await syncReceiptFromChain();
    if (active.length === 0) {
      setError("Nothing saved yet");
      return;
    }

    const total = active.reduce((s, r) => s + r.shares, 0n);
    if (mist > total) {
      setError(`Max: ${formatSui(total)} SUI`);
      return;
    }

    runTx(
      () =>
        buildWithdrawAmountTx(
          active.map((r) => ({ receiptId: r.id, shares: r.shares })),
          mist,
          account.address,
        ),
      () => {
        if (mist >= total) clearReceiptId(account.address);
        void refreshReceipt();
      },
    );
  };

  const handleSyncPyth = () => {
    if (!pyth?.priceUsd || !pythRefUsd) return;
    runTx(() => buildSyncPythMetricsTx(volatilityBpsFromPrices(pyth.priceUsd, pythRefUsd)));
  };

  if (!configured) {
    return (
      <div className="glass-card p-6 text-center text-sm text-[var(--muted)]">
        App not configured — set contract IDs in env.
      </div>
    );
  }

  return (
    <section className="glass-card mx-auto max-w-xl p-6">
      {/* Status strip */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-xs text-[var(--muted)]">ShieldScore</p>
          <p className="font-mono text-2xl font-bold tabular-nums" style={{ color: statusColor }}>
            {vaultLoading ? "…" : score}{" "}
            <span className="text-sm font-medium">{statusLabel}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--muted)]">You saved</p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {hasPosition ? `${formatSui(shares)} SUI` : "0 SUI"}
          </p>
          {pyth && (
            <p className="text-[10px] text-[var(--muted)]">
              1 SUI ≈ ${pyth.priceUsd.toFixed(3)}
            </p>
          )}
        </div>
      </div>

      {depositsBlocked && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
          Deposits paused (high risk). Withdraw still works.
        </p>
      )}

      {!account ? (
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Connect wallet above to continue.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Save */}
          <div>
            <label className="text-sm font-medium">Amount to save</label>
            <div className="relative mt-2">
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={depositsBlocked || isPending}
                className="input-field"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                SUI
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Wallet: {formatSui(spendableMist)} SUI available
            </p>
            <button
              type="button"
              disabled={isPending || depositsBlocked}
              onClick={() => void handleDeposit()}
              className="btn-primary mt-3 w-full py-3.5 text-sm"
            >
              {isPending ? "Signing…" : "Save"}
            </button>
          </div>

          {/* Withdraw — hidden on payment link to keep that flow simple */}
          {!paymentLink && (
            <div className="border-t border-[var(--border)] pt-6">
              <label className="text-sm font-medium">Withdraw from vault</label>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="0.001"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={!hasPosition || isPending}
                  placeholder={hasPosition ? "0.0" : "Save first"}
                  className="input-field"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                  SUI
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={!hasPosition || isPending}
                  onClick={() => setWithdrawAmount(formatSui(shares))}
                  className="chip"
                >
                  Max
                </button>
                <button
                  type="button"
                  disabled={isPending || !hasPosition}
                  onClick={() => void handleWithdraw()}
                  className="btn-secondary flex-1 py-3 text-sm"
                >
                  {isPending ? "Signing…" : "Withdraw"}
                </button>
              </div>
            </div>
          )}

          {demoControls && (
            <details className="text-xs text-[var(--muted)]">
              <summary className="cursor-pointer">Demo controls (testnet)</summary>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isPending || !pyth?.priceUsd}
                  onClick={handleSyncPyth}
                  className="btn-secondary py-2"
                >
                  Sync score from Pyth
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runTx(() => buildStressTx())}
                    className="btn-secondary flex-1 py-2 text-red-300"
                  >
                    Stress test
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runTx(() => buildResetMetricsTx())}
                    className="btn-secondary flex-1 py-2"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </details>
          )}
        </div>
      )}

      {txStatus && (
        <p className="mt-4 text-center text-xs text-emerald-400">
          {txStatus}
          {txDigest && (
            <>
              {" · "}
              <a
                href={EXPLORER.tx(txDigest)}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Explorer
              </a>
            </>
          )}
        </p>
      )}
      {error && (
        <p className="mt-3 text-center text-xs text-red-400">{error}</p>
      )}
    </section>
  );
}
