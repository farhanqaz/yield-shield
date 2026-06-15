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
import { ScoreGauge } from "./score-gauge";

const PYTH_REF_KEY = "yield-shield-pyth-ref-usd";
const PERCENT_PRESETS = [25, 50, 75, 100] as const;
type VaultTab = "deposit" | "withdraw";

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

function MetricTile({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      {loading ? (
        <div className="skeleton mt-2 h-6 w-24" />
      ) : (
        <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--text)]">
          {value}
        </p>
      )}
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  disabled,
  placeholder,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="relative">
        <input
          type="number"
          min="0.001"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="input-field"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--muted)]">
          SUI
        </span>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function PercentRow({
  onPick,
  disabled,
}: {
  onPick: (pct: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERCENT_PRESETS.map((pct) => (
        <button
          key={pct}
          type="button"
          disabled={disabled}
          onClick={() => onPick(pct)}
          className="chip"
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

  const [tab, setTab] = useState<VaultTab>("deposit");
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
    setTxStatus("Awaiting wallet signature…");

    signAndExecute(
      { transaction: build() },
      {
        onSuccess: async (result) => {
          setTxDigest(result.digest);
          setTxStatus("Transaction confirmed");

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
      <div className="glass-card border-amber-500/30 bg-amber-500/5 p-6 text-sm">
        <p className="font-semibold text-amber-200">Contract not configured</p>
        <p className="mt-2 text-[var(--muted)]">
          Set package and vault IDs in environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Risk radar */}
      <section className="glass-card p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Risk radar</h2>
          <span className="rounded-full border border-[var(--border)] bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Pyth · On-chain
          </span>
        </div>

        {vaultLoading && !vault ? (
          <div className="flex flex-col items-center py-8">
            <div className="skeleton h-40 w-40 rounded-full" />
            <div className="skeleton mt-4 h-4 w-32" />
          </div>
        ) : (
          <ScoreGauge score={score} status={status} />
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <MetricTile
            label="SUI / USD"
            loading={pythLoading}
            value={
              pyth
                ? `$${pyth.priceUsd.toFixed(4)}`
                : pythLoading
                  ? "…"
                  : "Unavailable"
            }
          />
          <MetricTile
            label="Your position"
            loading={receiptLoading}
            value={hasPosition ? `${formatSui(shares)} SUI` : "—"}
          />
        </div>

        {depositsBlocked && (
          <p className="mt-4 rounded-xl border border-[var(--paused)]/30 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-200">
            Circuit breaker active — new deposits paused. Withdrawals remain available.
          </p>
        )}
      </section>

      {/* Vault actions */}
      <section className="glass-card p-6 lg:p-8">
        <h2 className="text-lg font-semibold">Vault</h2>

        {!account ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Connect your wallet to deposit or withdraw.
          </p>
        ) : (
          <>
            <div className="mt-4 flex rounded-xl border border-[var(--border)] bg-black/20 p-1">
              {(["deposit", "withdraw"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium capitalize transition ${
                    tab === t
                      ? "bg-white/10 text-[var(--text)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {tab === "deposit" ? (
                <>
                  <AmountInput
                    value={depositAmount}
                    onChange={setDepositAmount}
                    disabled={depositsBlocked || isPending}
                    placeholder="0.0"
                    hint={`Available: ${formatSui(spendableMist)} SUI (gas reserved)`}
                  />
                  <PercentRow
                    disabled={depositsBlocked || isPending || spendableMist <= 0n}
                    onPick={setDepositFromPercent}
                  />
                  <button
                    type="button"
                    disabled={isPending || depositsBlocked}
                    onClick={() => void handleDeposit()}
                    className="btn-primary w-full py-3.5 text-sm"
                  >
                    {isPending ? "Signing…" : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <AmountInput
                    value={withdrawAmount}
                    onChange={setWithdrawAmount}
                    disabled={!hasPosition || isPending}
                    placeholder={hasPosition ? "0.0" : "No position"}
                    hint={
                      hasPosition
                        ? `In vault: ${formatSui(shares)} SUI`
                        : "Deposit first to build a position"
                    }
                  />
                  <PercentRow
                    disabled={!hasPosition || isPending}
                    onPick={setWithdrawFromPercent}
                  />
                  <button
                    type="button"
                    disabled={isPending || !hasPosition}
                    onClick={() => void handleWithdraw()}
                    className="btn-secondary w-full py-3.5 text-sm"
                  >
                    {isPending ? "Signing…" : "Withdraw"}
                  </button>
                </>
              )}
            </div>

            {demoControls && (
              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowDemo(!showDemo)}
                  className="text-[11px] text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {showDemo ? "▾ Hide demo controls" : "▸ Demo controls (testnet)"}
                </button>
                {showDemo && (
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={isPending || !pyth?.priceUsd}
                      onClick={handleSyncPyth}
                      className="btn-secondary py-2 text-xs"
                    >
                      Sync score from Pyth
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runTx(() => buildStressTx())}
                        className="btn-secondary flex-1 py-2 text-xs text-red-300"
                      >
                        Stress → pause
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runTx(() => buildResetMetricsTx())}
                        className="btn-secondary flex-1 py-2 text-xs"
                      >
                        Reset safe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {txStatus && (
          <div className="mt-4 rounded-xl border border-[var(--safe)]/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs font-medium text-emerald-300">{txStatus}</p>
            {txDigest && (
              <a
                href={EXPLORER.tx(txDigest)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block font-mono text-[10px] text-[var(--accent)] underline"
              >
                {txDigest.slice(0, 20)}…
              </a>
            )}
          </div>
        )}
        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
