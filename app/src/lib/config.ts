/**
 * Deploy config — set via .env.local (see .env.local.example).
 *
 * Use literal process.env.NEXT_PUBLIC_* access so Next.js inlines values
 * into the client bundle (dynamic process.env[key] does not work in browser).
 */
export const CONFIG = {
  network: "testnet" as const,
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID ?? "",
  vaultId: process.env.NEXT_PUBLIC_VAULT_ID ?? "",
  adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID ?? "",
  coinType: process.env.NEXT_PUBLIC_COIN_TYPE ?? "0x2::sui::SUI",
};

export function isConfigured(): boolean {
  return (
    CONFIG.packageId.length > 10 &&
    CONFIG.vaultId.length > 10 &&
    !CONFIG.packageId.includes("...")
  );
}

export const SHIELD_STATUS = {
  0: { label: "Safe", color: "var(--safe)" },
  1: { label: "Caution", color: "var(--caution)" },
  2: { label: "Paused", color: "var(--paused)" },
} as const;

export type ShieldStatusCode = keyof typeof SHIELD_STATUS;

export const MIST_PER_SUI = 1_000_000_000n;
