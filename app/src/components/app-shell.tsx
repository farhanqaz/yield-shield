"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { CONFIG } from "@/lib/config";
import { EXPLORER } from "@/lib/explorer";
import { Logo } from "./logo";

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
  const pathname = usePathname();
  const onSave = pathname?.startsWith("/save");

  return (
    <div className="app-bg">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(6,10,18,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 transition opacity-90 hover:opacity-100">
            <Logo />
            <div>
              <p className="text-sm font-semibold leading-none text-[var(--text)]">
                Yield Shield
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                Sui · DeFi & Payments
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                !onSave
                  ? "bg-white/5 text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/save?amount=0.5"
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                onSave
                  ? "bg-white/5 text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Smart Save
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {badge}
            <NetworkPill />
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-[var(--muted)] sm:flex-row sm:px-6 sm:text-left">
          <p>Programmable savings with on-chain ShieldScore guardrails.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/save?amount=0.5" className="transition hover:text-[var(--text)]">
              Payment link
            </Link>
            <a
              href={EXPLORER.vault()}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[var(--text)]"
            >
              Vault
            </a>
            <a
              href="https://github.com/farhanqaz/yield-shield"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[var(--text)]"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
