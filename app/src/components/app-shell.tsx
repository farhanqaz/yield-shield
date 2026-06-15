"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";
import { ReactNode } from "react";
import { EXPLORER } from "@/lib/explorer";
import { Logo } from "./logo";
import { CONFIG } from "@/lib/config";

function NetworkPill() {
  const isMainnet = CONFIG.network === "mainnet";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        isMainnet
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
      }`}
    >
      {isMainnet ? "Mainnet" : "Testnet"}
    </span>
  );
}

export function AppShell({
  children,
  badge,
}: {
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="app-bg">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(6,10,18,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo />
            <span className="text-sm font-semibold">Yield Shield</span>
          </Link>
          <div className="flex items-center gap-2">
            {badge}
            <NetworkPill />
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8 sm:py-10">{children}</main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        <a
          href={EXPLORER.vault()}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[var(--text)]"
        >
          View vault
        </a>
        {" · "}
        <a
          href="https://github.com/farhanqaz/yield-shield"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[var(--text)]"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
