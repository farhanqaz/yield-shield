import { CONFIG } from "./config";

export const SPLIT_STORAGE_KEY = "yield-shield-split-bps";
export const MIN_VAULT_BPS = 5000;
export const MAX_VAULT_BPS = 9500;

export const SPLIT_PRESETS = [
  { label: "50/50", bps: 5000 },
  { label: "70/30", bps: 7000 },
  { label: "85/15", bps: 8500 },
  { label: "90/10", bps: 9000 },
] as const;

export function clampVaultBps(bps: number): number {
  return Math.min(MAX_VAULT_BPS, Math.max(MIN_VAULT_BPS, Math.round(bps)));
}

export function defaultVaultBps(): number {
  return clampVaultBps(CONFIG.smartSaveVaultBps);
}

export function loadVaultBps(): number {
  if (typeof window === "undefined") return defaultVaultBps();
  const stored = localStorage.getItem(SPLIT_STORAGE_KEY);
  if (stored) {
    const n = parseInt(stored, 10);
    if (Number.isFinite(n)) return clampVaultBps(n);
  }
  return defaultVaultBps();
}

export function saveVaultBps(bps: number): void {
  localStorage.setItem(SPLIT_STORAGE_KEY, String(clampVaultBps(bps)));
}

export function vaultBpsFromUrlParam(param: string | null): number | null {
  if (!param) return null;
  const n = parseInt(param, 10);
  if (!Number.isFinite(n) || n < 50 || n > 95) return null;
  return n * 100;
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}
