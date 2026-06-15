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
} from "@/lib/transactions";
import { volatilityBpsFromPrices } from "@/lib/pyth";
import { EXPLORER } from "@/lib/explorer";
import { buildSmartSaveTx } from "@/lib/smart-save";
import { useReceipt, storeReceiptId, clearReceiptId } from "@/hooks/useReceipt";
import { usePythPrice } from "@/hooks/usePythPrice";
import { useVault } from "@/hooks/useVault";
import { ScoreGauge } from "./score-gauge";

const PYTH_REF_KEY = "yield-shield-pyth-ref-usd";

function findCreatedReceiptId(
  objectChanges: Array<{ type: string; objectType?: string; objectId?: string }> | undefined,
): string | null {
  if (!objectChanges) return null;
  for (const change of objectChanges) {
    if (
      change.type === "created" &&
      change.objectType?.includes("ShieldReceipt") &&
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
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showObjectChanges: true, showEffects: true },
      }),
  });

  const { vault, isPending: vaultLoading } = useVault();
  const { receiptId, shares, hasReceipt, refreshStoredReceipt } = useReceipt(
    account?.address,
  );
  const { data: pyth, isLoading: pythLoading } = usePythPrice();

  const [amount, setAmount] = useState(defaultAmount);
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
  const emergencyRecommended = status >= 1 && hasReceipt;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["suix_getObject"] });
    queryClient.invalidateQueries({ queryKey: ["suix_getOwnedObjects"] });
  };

  const runTx = (
    build: () => ReturnType<typeof buildDepositTx>,
    onSuccess?: (result: { objectChanges?: unknown[] }) => void,
  ) => {
    if (!account) return;
    setError(null);
    setTxDigest(null);
    setTxStatus("Awaiting wallet signature…");

    signAndExecute(
      { transaction: build() },
      {
        onSuccess: (result) => {
          setTxDigest(result.digest);
          setTxStatus(`Confirmed: ${result.digest.slice(0, 16)}…`);
          onSuccess?.(result as { objectChanges?: unknown[] });
          invalidate();
        },
        onError: (e) => {
          setError(e.message);
          setTxStatus(null);
        },
      },
    );
  };

  const handleSmartSave = () => {
    if (!account) return;
    const mist = BigInt(Math.floor(parseFloat(amount) * Number(MIST_PER_SUI)));
    if (mist <= BigInt(0)) {
      setError("Enter a valid amount");
      return;
    }

    const vaultBps = CONFIG.smartSaveVaultBps;

    if (CONFIG.enableNavi) {
      setError("NAVI composable PTB is mainnet-only. Use Smart Save on testnet.");
      return;
    }

    runTx(
      () =>
        buildSmartSaveTx(mist, account.address, {
          vaultRatioBps: vaultBps,
          receiptId: hasReceipt && receiptId ? receiptId : undefined,
        }),
      (result) => {
        const id = findCreatedReceiptId(
          result.objectChanges as Parameters<typeof findCreatedReceiptId>[0],
        );
        if (id) {
          storeReceiptId(id);
          refreshStoredReceipt();
        }
      },
    );
  };

  const handleEmergencyExit = () => {
    if (!account || !receiptId || shares <= BigInt(0)) return;
    runTx(() => buildWithdrawTx(shares, receiptId, account.address), () => {
      clearReceiptId();
      refreshStoredReceipt();
    });
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
              {hasReceipt ? `${(Number(shares) / 1e9).toFixed(4)} SUI` : "None"}
            </span>
          </div>
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
            {hasReceipt && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleEmergencyExit}
                className="rounded-xl px-4 py-4 text-sm font-bold text-white shadow-lg transition disabled:opacity-40"
                style={{
                  backgroundColor: emergencyRecommended
                    ? "var(--paused)"
                    : "#b91c1c",
                  boxShadow: emergencyRecommended
                    ? `0 0 24px ${statusColor}55`
                    : undefined,
                }}
              >
                {isPending ? "Signing…" : "Emergency Exit — withdraw all (PTB)"}
              </button>
            )}

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
                  if (hasReceipt && receiptId) {
                    runTx(() => buildDepositIntoReceiptTx(mist, receiptId));
                  } else {
                    runTx(() => buildDepositTx(mist, account.address), (result) => {
                      const id = findCreatedReceiptId(
                        result.objectChanges as Parameters<typeof findCreatedReceiptId>[0],
                      );
                      if (id) {
                        storeReceiptId(id);
                        refreshStoredReceipt();
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
