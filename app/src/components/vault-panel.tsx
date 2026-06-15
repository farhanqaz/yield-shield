"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type CSSProperties } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { CONFIG, MIST_PER_SUI, isConfigured, showDemoControls, isNaviMode, autoShieldKeeperEnabled } from "@/lib/config";
import {
  buildResetMetricsTx,
  buildStressTx,
  buildSyncPythMetricsTx,
  buildWithdrawAmountTx,
} from "@/lib/transactions";
import { volatilityBpsFromPrices } from "@/lib/pyth";
import { EXPLORER } from "@/lib/explorer";
import { buildSmartSaveTx, SMART_SAVE_GAS_BUFFER_MIST } from "@/lib/smart-save";
import { buildNaviWithdrawTx } from "@/lib/navi";
import {
  defaultVaultBps as getDefaultVaultBps,
  loadVaultBps,
  saveVaultBps,
} from "@/lib/split-preference";
import { useReceipt, storeReceiptId, clearReceiptId } from "@/hooks/useReceipt";
import { usePythPrice } from "@/hooks/usePythPrice";
import { useVault } from "@/hooks/useVault";
import { useNaviApy, useNaviSupply } from "@/hooks/useNavi";
import { useShieldKeeper } from "@/hooks/useShieldKeeper";
import { usePortfolioLedger } from "@/hooks/usePortfolioLedger";
import { SplitSlider } from "@/components/charts/split-slider";
import { SplitPreview } from "@/components/charts/split-preview";
import { PortfolioPnl } from "@/components/portfolio-pnl";
import { ShieldScoreChart } from "@/components/charts/shield-score-chart";

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
  defaultVaultBps: initialVaultBps,
  paymentLink = false,
}: {
  defaultAmount?: string;
  defaultVaultBps?: number;
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
  const naviMode = isNaviMode();
  const naviApy = useNaviApy();
  const { data: naviSupplyMist = 0n, refetch: refetchNavi } = useNaviSupply(
    account?.address,
  );

  useShieldKeeper();

  const { ledger, recordDeposit, recordWithdraw, setBasisFromSupply } =
    usePortfolioLedger(account?.address);

  const { data: walletBalance } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "" },
    { enabled: !!account },
  );

  const [depositAmount, setDepositAmount] = useState(defaultAmount);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [vaultBps, setVaultBps] = useState(() =>
    initialVaultBps ?? getDefaultVaultBps(),
  );
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pythRefUsd, setPythRefUsd] = useState<number | null>(null);

  useEffect(() => {
    setDepositAmount(defaultAmount);
  }, [defaultAmount]);

  useEffect(() => {
    if (initialVaultBps != null) {
      setVaultBps(initialVaultBps);
      return;
    }
    setVaultBps(loadVaultBps());
  }, [initialVaultBps]);

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

  const vaultSuiNum = naviMode
    ? Number(naviSupplyMist) / Number(MIST_PER_SUI)
    : Number(shares) / Number(MIST_PER_SUI);
  const effectiveShares = naviMode ? naviSupplyMist : shares;
  const effectiveHasPosition = naviMode ? naviSupplyMist > 0n : hasPosition;
  const walletSuiNum = Number(walletMist) / Number(MIST_PER_SUI);
  const depositSuiNum = parseFloat(depositAmount) || 0;
  const vaultPct = vaultBps / 100;

  const handleVaultBpsChange = (bps: number) => {
    setVaultBps(bps);
    saveVaultBps(bps);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sui-client"] });
  };

  const runTx = (
    build: () => Promise<Transaction> | Transaction,
    onSuccess?: (
      digest: string,
      objectChanges?: Parameters<typeof findCreatedReceiptId>[0],
    ) => void,
  ) => {
    if (!account) return;
    setError(null);
    setTxDigest(null);
    setTxStatus("Confirm in wallet…");

    void Promise.resolve(build()).then((transaction) => {
      signAndExecute(
        { transaction },
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
            void refetchNavi();
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
    });
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
          vaultRatioBps: vaultBps,
          receiptId: naviMode ? undefined : receiptId ?? undefined,
        }),
      async (_digest, objectChanges) => {
        const vaultMist = (mist * BigInt(vaultBps)) / 10000n;
        recordDeposit(vaultMist);
        if (naviMode) return;
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

    if (naviMode) {
      if (mist > naviSupplyMist) {
        setError(`Max: ${formatSui(naviSupplyMist)} SUI in NAVI`);
        return;
      }
      runTx(
        () => buildNaviWithdrawTx(mist, account.address),
        () => {
          recordWithdraw(mist);
          void refetchNavi();
        },
      );
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
        recordWithdraw(mist);
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
    <div className="mx-auto max-w-xl space-y-4">
      {/* Metrics + portfolio */}
      <section className="glass-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {vaultLoading ? (
            <div className="skeleton h-16 w-40 rounded-xl" />
          ) : (
            <ShieldScoreChart score={score} status={status} compact />
          )}
          {pyth && (
            <div className="text-right text-xs text-[var(--muted)]">
              <p>SUI / USD</p>
              <p className="font-mono text-base font-semibold text-[var(--text)]">
                ${pyth.priceUsd.toFixed(4)}
              </p>
              {naviMode && naviApy != null && (
                <p className="mt-1 text-emerald-400">
                  NAVI supply ~{naviApy.toFixed(2)}% APY
                </p>
              )}
              {autoShieldKeeperEnabled() && (
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                  ShieldScore auto-sync on
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <PortfolioPnl
            vaultSui={vaultSuiNum}
            walletSui={walletSuiNum}
            priceUsd={pyth?.priceUsd}
            apyPercent={naviApy}
            shieldScore={score}
            shieldStatus={status}
            ledger={ledger}
            onSetBasis={
              naviMode && naviSupplyMist > 0n
                ? () => setBasisFromSupply(naviSupplyMist)
                : undefined
            }
          />
        </div>

        {depositsBlocked && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
            Deposits paused (ShieldScore). Withdraw still works.
          </p>
        )}

        {naviMode && (
          <p className="mt-3 text-center text-[11px] text-emerald-400/90">
            Vault portion earns real yield via NAVI lending on mainnet.
          </p>
        )}
      </section>

      {/* Save */}
      <section className="glass-card p-5">
        {!account ? (
          <p className="text-center text-sm text-[var(--muted)]">
            Connect wallet above to continue.
          </p>
        ) : (
          <div className="space-y-5">
            <div style={{ "--split-pct": `${vaultPct}%` } as CSSProperties}>
              <SplitSlider
                vaultBps={vaultBps}
                onChange={handleVaultBpsChange}
                disabled={depositsBlocked || isPending}
              />
            </div>

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
                Available: {formatSui(spendableMist)} SUI
              </p>
            </div>

            <SplitPreview
              totalSui={depositSuiNum}
              vaultBps={vaultBps}
              priceUsd={pyth?.priceUsd}
            />

            <button
              type="button"
              disabled={isPending || depositsBlocked}
              onClick={() => void handleDeposit()}
              className="btn-primary w-full py-3.5 text-sm"
            >
              {isPending ? "Signing…" : naviMode ? "Save → NAVI yield" : "Save"}
            </button>

            {!paymentLink && (
              <div className="border-t border-[var(--border)] pt-5">
                <label className="text-sm font-medium">
                  {naviMode ? "Withdraw from NAVI" : "Withdraw from vault"}
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={!effectiveHasPosition || isPending}
                    placeholder={effectiveHasPosition ? "0.0" : "Save first"}
                    className="input-field"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                    SUI
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={!effectiveHasPosition || isPending}
                    onClick={() => setWithdrawAmount(formatSui(effectiveShares))}
                    className="chip"
                  >
                    Max
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !effectiveHasPosition}
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
    </div>
  );
}
