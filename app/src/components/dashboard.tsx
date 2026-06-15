"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { VaultPanel } from "./vault-panel";

export function Dashboard() {
  const account = useCurrentAccount();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--muted)]">
            Yield Shield · DeFi & Payments
          </p>
          <h1 className="text-2xl font-semibold leading-tight">
            Programmable DeFi safety rail
          </h1>
          <p className="mt-1 max-w-xs text-xs text-[var(--muted)]">
            Earn with guardrails. Emergency Exit in one atomic PTB when risk
            spikes.
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
          href="https://github.com/contract-hero/sui-pilot"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Built with sui-pilot
        </a>
      </footer>
    </div>
  );
}
