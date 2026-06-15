/**
 * Deploy config — set via .env.local (see .env.local.example).
 *
 * Use literal process.env.NEXT_PUBLIC_* access so Next.js inlines values
 * into the client bundle (dynamic process.env[key] does not work in browser).
 */
export const CONFIG = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
    | "testnet"
    | "mainnet",
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID ?? "",
  vaultId: process.env.NEXT_PUBLIC_VAULT_ID ?? "",
  adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID ?? "",
  coinType: process.env.NEXT_PUBLIC_COIN_TYPE ?? "0x2::sui::SUI",
  /** NAVI lending is mainnet-only — set true when vault is deployed on mainnet */
  enableNavi: process.env.NEXT_PUBLIC_ENABLE_NAVI === "true",
  /** Default vault allocation for Smart Save PTB (basis points) */
  smartSaveVaultBps: Number(process.env.NEXT_PUBLIC_SMART_SAVE_VAULT_BPS ?? "8500"),
};

export function isConfigured(): boolean {
  return (
    CONFIG.packageId.length > 10 &&
    CONFIG.vaultId.length > 10 &&
    !CONFIG.packageId.includes("...")
  );
}

/** Admin demo controls — testnet only, hidden on mainnet production. */
export function showDemoControls(): boolean {
  return CONFIG.network !== "mainnet" && CONFIG.adminCapId.length > 10;
}

/** Real NAVI yield on mainnet when enabled. */
export function isNaviMode(): boolean {
  return CONFIG.enableNavi && CONFIG.network === "mainnet";
}

/** Auto ShieldScore keeper (Pyth + NAVI pool metrics). */
export function autoShieldKeeperEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTO_SHIELD_KEEPER === "true";
}

export const SHIELD_STATUS = {
  0: { label: "Safe", color: "var(--safe)" },
  1: { label: "Caution", color: "var(--caution)" },
  2: { label: "Paused", color: "var(--paused)" },
} as const;

export type ShieldStatusCode = keyof typeof SHIELD_STATUS;

export const MIST_PER_SUI = 1_000_000_000n;
