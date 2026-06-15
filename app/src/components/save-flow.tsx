"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VaultPanel } from "./vault-panel";
import { CONFIG } from "@/lib/config";

function SaveFlowInner() {
  const params = useSearchParams();
  const preset = params.get("amount") ?? "0.5";
  const account = useCurrentAccount();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
            Yield Shield · Programmable payment
          </p>
          <h1 className="text-2xl font-semibold leading-tight">
            Incoming payment → auto-save
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Static transfers are dead. This link routes funds in one atomic PTB:
            guarded vault + liquid buffer — no manual steps.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Suggested amount: <strong className="text-[var(--text)]">{preset} SUI</strong>
          </p>
        </div>
        <ConnectButton />
      </header>

      <section className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
        <p className="font-medium text-blue-200">Payment → financial action</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Track fit:{" "}
          <a
            href="https://mystenlabs.notion.site/defi-payments-problem-statement"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            programmable money on Sui
          </a>
          — split, deposit, and guard in a single transaction.
        </p>
      </section>

      {!account ? (
        <p className="text-center text-sm text-[var(--muted)]">
          Connect wallet to execute programmable save.
        </p>
      ) : (
        <VaultPanel defaultAmount={preset} />
      )}

      <footer className="text-center text-xs text-[var(--muted)]">
        <Link href="/" className="underline">
          ← Dashboard
        </Link>
        {" · "}
        <a
          href={`https://github.com/farhanqaz/yield-shield`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          GitHub
        </a>
        {CONFIG.enableNavi && " · NAVI composable (mainnet)"}
      </footer>
    </div>
  );
}

export function SaveFlow() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading…</p>}>
      <SaveFlowInner />
    </Suspense>
  );
}
