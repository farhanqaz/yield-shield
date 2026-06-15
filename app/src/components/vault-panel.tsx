"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CONFIG,
  MIST_PER_SUI,
  SHIELD_STATUS,
  isConfigured,
} from "@/lib/config";
import {
  buildDepositIntoReceiptTx,
  buildDepositTx,
  buildResetMetricsTx,
  buildStressTx,
  buildSyncPythMetricsTx,
  buildWithdrawTx,
  buildWithdrawAllTx,
} from "@/lib/transactions";
import { volatilityBpsFromPrices } from "@/lib/pyth";
import { EXPLORER } from "@/lib/explorer";
import { buildSmartSaveTx, SMART_SAVE_GAS_BUFFER_MIST } from "@/lib/smart-save";
import { useReceipt, storeReceiptId, clearReceiptId } from "@/hooks/useReceipt";
import { usePythPrice } from "@/hooks/usePythPrice";
import { useVault } from "@/hooks/useVault";
import { ScoreGauge } from "./score-gauge";

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

export function VaultPanel({ defaultAmount = "0.1" }: { defaultAmount?: string }) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const { vault, isPending: vaultLoading } = useVault();
  const { receipts, receiptId, shares, hasPosition, isLoading: receiptLoading, refreshReceipt, syncReceiptFromChain } = useReceipt(
    account?.address,
  );
  const { data: pyth, isLoading: pythLoading } = usePythPrice();

  const [amount, setAmount] = useState(defaultAmount);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (hasPosition) {
      setWithdrawAmount((Number(shares) / 1e9).toFixed(4));
    } else {
      setWithdrawAmount("");
    }
  }, [hasPosition, shares]);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [pythRefUsd, setPythRefUsd] = useState<number | null>(null);

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
  const statusColor = SHIELD_STATUS[status].color;
  const emergencyRecommended = status >= 1 && hasPosition;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sui-client"] });
  };

  const runTx = (
    build: () => ReturnType<typeof buildDepositTx>,
    onSuccess?: (
      digest: string,
      objectChanges?: Parameters<typeof findCreatedReceiptId>[0],
    ) => void,
  ) => {
    if (!account) return;
    setError(null);
    setTxDigest(null);
    setTxStatus("Awaiting wallet signature…");

    signAndExecute(
      { transaction: build() },
      {
        onSuccess: async (result) => {
          setTxDigest(result.digest);
          setTxStatus(`Confirmed: ${result.digest.slice(0, 16)}…`);

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
          const msg =
            e.message === "Unexpected error"
              ? "Transaction failed — try a smaller amount (keep ~0.02 SUI for gas) or use Direct vault deposit."
              : e.message === "Could not parse effects from transaction result."
                ? "Transaction may have succeeded — refresh the page and check your wallet balance."
                : e.message;
          setError(msg);
          setTxStatus(null);
        },
      },
    );
  };

  const handleSmartSave = async () => {
    if (!account) return;
    const mist = BigInt(Math.floor(parseFloat(amount) * Number(MIST_PER_SUI)));
    if (mist <= BigInt(0)) {
      setError("Enter a valid amount");
      return;
    }

    if (CONFIG.enableNavi) {
      setError("NAVI composable PTB is mainnet-only. Use Smart Save on testnet.");
      return;
    }

    try {
      const { totalBalance } = await client.getBalance({ owner: account.address });
      const balance = BigInt(totalBalance);
      if (mist + SMART_SAVE_GAS_BUFFER_MIST > balance) {
        setError(
          `Need ~${(Number(mist + SMART_SAVE_GAS_BUFFER_MIST) / 1e9).toFixed(3)} SUI total (amount + gas buffer). Lower the amount or add testnet SUI.`,
        );
        return;
      }
    } catch {
      // balance check failed — still attempt tx
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

    const active = receipts.length > 0 ? receipts : await syncReceiptFromChain();
    if (active.length === 0) {
      setError("No vault position found — deposit first.");
      return;
    }

    const total = active.reduce((s, r) => s + r.shares, 0n);
    const withdrawMist = BigInt(
      Math.floor(parseFloat(withdrawAmount || "0") * Number(MIST_PER_SUI)),
    );
    if (withdrawMist <= 0n || withdrawMist > total) {
      setError(`Enter 0.001 – ${(Number(total) / 1e9).toFixed(4)} SUI`);
      return;
    }

    // Withdraw all if amount equals total (may span multiple receipts)
    if (withdrawMist === total) {
      runTx(
        () =>
          buildWithdrawAllTx(
            active.map((r) => ({ receiptId: r.id, shares: r.shares })),
            account.address,
          ),
        () => {
          clearReceiptId(account.address);
          void refreshReceipt();
        },
      );
      return;
    }

    const primary = active[0];
    if (withdrawMist > primary.shares) {
      setError("Partial withdraw > largest receipt — use Emergency Exit for full amount.");
      return;
    }

    runTx(
      () => buildWithdrawTx(withdrawMist, primary.id, account.address),
      () => void refreshReceipt(),
    );
  };

  const handleEmergencyExit = async () => {
    if (!account) return;
    setError(null);

    const active = receipts.length > 0 ? receipts : await syncReceiptFromChain();
    if (active.length === 0) {
      setError("No vault balance to withdraw.");
      return;
    }

    runTx(
      () =>
        buildWithdrawAllTx(
          active.map((r) => ({ receiptId: r.id, shares: r.shares })),
          account.address,
        ),
      () => {
        clearReceiptId(account.address);
        void refreshReceipt();
      },
    );
  };

  const handleSyncPyth = () => {
    if (!pyth?.priceUsd || !pythRefUsd) return;
    const volBps = volatilityBpsFromPrices(pyth.priceUsd, pythRefUsd);
    runTx(() => buildSyncPythMetricsTx(volBps));
  };

  const handleStress = () => runTx(() => buildStressTx());
  const handleReset = () => runTx(() => buildResetMetricsTx());

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm">
        <p className="font-medium text-amber-200">Contract not configured</p>
        <p className="mt-2 text-[var(--muted)]">
          Copy <code className="text-xs">.env.local.example</code> →{" "}
          <code className="text-xs">.env.local</code> and fill package / vault
          IDs after deploy.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Risk radar</h2>
          <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            Pyth{CONFIG.enableNavi ? " · NAVI" : ""} · PTB
          </span>
        </div>

        {vaultLoading && !vault ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Loading vault…</p>
        ) : (
          <ScoreGauge score={score} status={status} />
        )}

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Pyth SUI/USD</span>
            <span className="font-mono tabular-nums">
              {pythLoading
                ? "…"
                : pyth
                  ? `$${pyth.priceUsd.toFixed(4)}`
                  : "—"}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
            <span>Your position</span>
            <span>
              {hasPosition
                ? `${(Number(shares) / 1e9).toFixed(4)} SUI`
                : receiptLoading
                  ? "Loading…"
                  : "None"}
            </span>
          </div>
          {receipts.length > 1 && (
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              {receipts.length} active receipts — total shown above
            </p>
          )}
        </div>

        {depositsBlocked && (
          <p className="mt-4 rounded-lg border border-[var(--paused)]/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            Circuit breaker active — new deposits blocked. Use Emergency Exit to
            withdraw atomically via PTB.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="mb-1 text-lg font-medium">Programmable Save</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          One PTB — incoming funds auto-route to guarded vault
          {CONFIG.enableNavi ? " + NAVI yield" : ""} with liquid buffer kept in
          wallet. No manual orchestration.
        </p>

        {!account ? (
          <p className="text-sm text-[var(--muted)]">
            Connect wallet to use Yield Shield.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <h3 className="text-sm font-medium">Withdraw from vault</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Pull SUI from your ShieldReceipt back to wallet (always allowed,
                even when Paused).
              </p>

              {hasPosition ? (
                <div className="mt-3 flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--muted)]">Withdraw amount (SUI)</span>
                    <input
                      type="number"
                      min="0.001"
                      step="0.01"
                      max={(Number(shares) / 1e9).toString()}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--safe)]"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void handleWithdraw()}
                    className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                  >
                    {isPending ? "Signing…" : "Withdraw to wallet"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleEmergencyExit}
                    className="rounded-xl px-4 py-3 text-sm font-bold text-white"
                    style={{
                      backgroundColor: emergencyRecommended
                        ? "var(--paused)"
                        : "#b91c1c",
                      boxShadow: emergencyRecommended
                        ? `0 0 24px ${statusColor}55`
                        : undefined,
                    }}
                  >
                    Emergency Exit — withdraw all (PTB)
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  No vault position yet. Use Smart Save or deposit below.
                </p>
              )}
            </section>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Deposit amount (SUI)</span>
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={depositsBlocked}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 outline-none focus:border-[var(--safe)] disabled:opacity-50"
              />
            </label>

            <button
              type="button"
              disabled={isPending || depositsBlocked}
              onClick={handleSmartSave}
              className="rounded-xl bg-[var(--safe)] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              {isPending
                ? "Signing…"
                : `Smart Save — ${CONFIG.smartSaveVaultBps / 100}% vault / ${(10000 - CONFIG.smartSaveVaultBps) / 100}% liquid (1 PTB)`}
            </button>

            <details className="text-xs text-[var(--muted)]">
              <summary className="cursor-pointer underline">Direct vault deposit</summary>
              <button
                type="button"
                disabled={isPending || depositsBlocked}
                onClick={() => {
                  if (!account) return;
                  const mist = BigInt(
                    Math.floor(parseFloat(amount) * Number(MIST_PER_SUI)),
                  );
                  if (mist <= BigInt(0)) {
                    setError("Enter a valid amount");
                    return;
                  }
                  if (hasPosition && receiptId) {
                    runTx(() => buildDepositIntoReceiptTx(mist, receiptId));
                  } else {
                    runTx(() => buildDepositTx(mist, account.address), async (_digest, objectChanges) => {
                      let id = findCreatedReceiptId(objectChanges);
                      if (!id) {
                        const synced = await syncReceiptFromChain();
                        id = synced[0]?.id ?? null;
                      }
                      if (id) {
                        storeReceiptId(account.address, id);
                        await refreshReceipt();
                      }
                    });
                  }
                }}
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
              >
                Deposit 100% to vault
              </button>
            </details>

            {CONFIG.adminCapId && (
              <div className="mt-2 border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  onClick={() => setShowDemo(!showDemo)}
                  className="text-xs text-[var(--muted)] underline"
                >
                  {showDemo ? "Hide" : "Show"} demo controls (video / admin)
                </button>
                {showDemo && (
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={isPending || !pyth?.priceUsd}
                      onClick={handleSyncPyth}
                      className="rounded-xl border border-blue-500/40 px-3 py-2 text-xs text-blue-300"
                    >
                      Sync ShieldScore from Pyth (keeper PTB)
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleStress}
                        className="flex-1 rounded-xl border border-[var(--paused)]/50 px-3 py-2 text-xs text-red-300"
                      >
                        Demo: stress → pause
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleReset}
                        className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs"
                      >
                        Demo: reset safe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {txStatus && (
          <p className="mt-3 text-xs text-[var(--safe)]">{txStatus}</p>
        )}
        {txDigest && (
          <a
            href={EXPLORER.tx(txDigest)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-blue-400 underline"
          >
            View on Suiscan
          </a>
        )}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </section>
    </>
  );
}
