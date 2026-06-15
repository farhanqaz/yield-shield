"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CONFIG, MIST_PER_SUI, isConfigured } from "@/lib/config";
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
import { ScoreGauge } from "./score-gauge";

const PYTH_REF_KEY = "yield-shield-pyth-ref-usd";
const PERCENT_PRESETS = [25, 50, 75, 100] as const;

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

function PercentRow({
  label,
  onPick,
  disabled,
}: {
  label: string;
  onPick: (pct: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      {PERCENT_PRESETS.map((pct) => (
        <button
          key={pct}
          type="button"
          disabled={disabled}
          onClick={() => onPick(pct)}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--safe)] hover:text-[var(--text)] disabled:opacity-40"
        >
          {pct === 100 ? "Max" : `${pct}%`}
        </button>
      ))}
    </div>
  );
}

export function VaultPanel({ defaultAmount = "0.1" }: { defaultAmount?: string }) {
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
    isLoading: receiptLoading,
    refreshReceipt,
    syncReceiptFromChain,
  } = useReceipt(account?.address);
  const { data: pyth, isLoading: pythLoading } = usePythPrice();

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
              ? "Transaction failed — try a smaller amount (keep ~0.02 SUI for gas)."
              : e.message === "Could not parse effects from transaction result."
                ? "Transaction may have succeeded — refresh and check your wallet."
                : e.message;
          setError(msg);
          setTxStatus(null);
        },
      },
    );
  };

  const setDepositFromPercent = (pct: number) => {
    if (spendableMist <= 0n) return;
    const mist = (spendableMist * BigInt(pct)) / 100n;
    setDepositAmount(formatSui(mist));
  };

  const setWithdrawFromPercent = (pct: number) => {
    if (shares <= 0n) return;
    const mist = (shares * BigInt(pct)) / 100n;
    setWithdrawAmount(formatSui(mist));
  };

  const handleDeposit = async () => {
    if (!account) return;
    const mist = mistFromInput(depositAmount);
    if (!mist) {
      setError("Enter a valid deposit amount");
      return;
    }
    if (mist + SMART_SAVE_GAS_BUFFER_MIST > walletMist) {
      setError("Amount too high — keep ~0.02 SUI for gas.");
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
      setError("Enter a valid withdraw amount");
      return;
    }

    const active = receipts.length > 0 ? receipts : await syncReceiptFromChain();
    if (active.length === 0) {
      setError("No vault position — deposit first.");
      return;
    }

    const total = active.reduce((s, r) => s + r.shares, 0n);
    if (mist > total) {
      setError(`Max withdraw: ${formatSui(total)} SUI`);
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
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm">
        <p className="font-medium text-amber-200">Contract not configured</p>
        <p className="mt-2 text-[var(--muted)]">
          Fill <code className="text-xs">.env.local</code> with package and vault IDs.
        </p>
      </div>
    );
  }

  const vaultPct = CONFIG.smartSaveVaultBps / 100;
  const liquidPct = (10000 - CONFIG.smartSaveVaultBps) / 100;

  return (
    <>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Risk radar</h2>
          <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            Pyth · PTB
          </span>
        </div>

        {vaultLoading && !vault ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p>
        ) : (
          <ScoreGauge score={score} status={status} />
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            <p className="text-[10px] uppercase text-[var(--muted)]">Pyth SUI/USD</p>
            <p className="mt-0.5 font-mono tabular-nums">
              {pythLoading ? "…" : pyth ? `$${pyth.priceUsd.toFixed(4)}` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            <p className="text-[10px] uppercase text-[var(--muted)]">In vault</p>
            <p className="mt-0.5 font-mono tabular-nums">
              {hasPosition
                ? `${formatSui(shares)} SUI`
                : receiptLoading
                  ? "…"
                  : "—"}
            </p>
          </div>
        </div>

        {depositsBlocked && (
          <p className="mt-3 rounded-lg border border-[var(--paused)]/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            Deposits paused — withdraw still available.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-medium">Vault</h2>

        {!account ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Connect wallet to continue.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {/* Deposit */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--muted)]">Deposit</p>
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={depositsBlocked || isPending}
                placeholder="0.0"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--safe)] disabled:opacity-50"
              />
              <PercentRow
                label="Of wallet"
                disabled={depositsBlocked || isPending || spendableMist <= 0n}
                onPick={setDepositFromPercent}
              />
              <button
                type="button"
                disabled={isPending || depositsBlocked}
                onClick={() => void handleDeposit()}
                className="rounded-xl bg-[var(--safe)] py-3 text-sm font-semibold text-black disabled:opacity-40"
              >
                {isPending ? "Signing…" : `Save — ${vaultPct}% vault · ${liquidPct}% wallet`}
              </button>
            </div>

            <div className="h-px bg-[var(--border)]" />

            {/* Withdraw */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--muted)]">Withdraw</p>
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={!hasPosition || isPending}
                placeholder={hasPosition ? "0.0" : "No position"}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--safe)] disabled:opacity-50"
              />
              <PercentRow
                label="Of vault"
                disabled={!hasPosition || isPending}
                onPick={setWithdrawFromPercent}
              />
              <button
                type="button"
                disabled={isPending || !hasPosition}
                onClick={() => void handleWithdraw()}
                className="rounded-xl border border-[var(--border)] py-3 text-sm font-semibold disabled:opacity-40"
              >
                {isPending ? "Signing…" : "Withdraw"}
              </button>
            </div>

            {CONFIG.adminCapId && (
              <div className="border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  onClick={() => setShowDemo(!showDemo)}
                  className="text-xs text-[var(--muted)] underline"
                >
                  {showDemo ? "Hide demo" : "Demo controls"}
                </button>
                {showDemo && (
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={isPending || !pyth?.priceUsd}
                      onClick={handleSyncPyth}
                      className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs text-blue-300"
                    >
                      Sync score from Pyth
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runTx(() => buildStressTx())}
                        className="flex-1 rounded-lg border border-[var(--paused)]/50 py-2 text-xs text-red-300"
                      >
                        Stress → pause
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runTx(() => buildResetMetricsTx())}
                        className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs"
                      >
                        Reset safe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {txStatus && <p className="mt-3 text-xs text-[var(--safe)]">{txStatus}</p>}
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
