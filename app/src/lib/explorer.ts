import { CONFIG } from "./config";

const network = CONFIG.network === "mainnet" ? "mainnet" : "testnet";
const base = `https://suiscan.xyz/${network}`;

export const EXPLORER = {
  network,
  object: (id: string) => `${base}/object/${id}`,
  tx: (digest: string) => `${base}/tx/${digest}`,
  package: () =>
    CONFIG.packageId ? `${base}/object/${CONFIG.packageId}` : base,
  vault: () => (CONFIG.vaultId ? `${base}/object/${CONFIG.vaultId}` : base),
};
