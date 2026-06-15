"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { VaultPanel } from "./vault-panel";

export function Dashboard() {
  const account = useCurrentAccount();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
            Yield Shield · Sui Overflow 2026
          </p>
          <h1 className="text-2xl font-semibold leading-tight">
            Programmable money with guardrails
          </h1>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
            Payments become financial actions — Smart Save routes funds in one
            PTB. ShieldScore pauses new deposits when risk spikes. Withdraw anytime.
          </p>
          {account && (
            <p className="mt-2 truncate font-mono text-[10px] text-[var(--muted)]">
              {account.address}
            </p>
          )}
        </div>
        <ConnectButton />
      </header>

      <VaultPanel />

      <footer className="text-center text-[10px] text-[var(--muted)]">
        <Link href="/save?amount=0.5" className="underline">
          Programmable payment link
        </Link>
        {" · "}
        <a
          href="https://suiscan.xyz/testnet/object/0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Vault on Suiscan
        </a>
        {" · "}
        <a
          href="https://github.com/farhanqaz/yield-shield"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
