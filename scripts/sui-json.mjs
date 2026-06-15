#!/usr/bin/env node
/** Parse Sui CLI --json output without jq */
import { readFileSync } from "node:fs";

const mode = process.argv[2];
const raw = process.argv[3] ?? readFileSync(0, "utf8");
const data = JSON.parse(raw || "null");

function vaultId(changes) {
  const list = changes ?? [];
  const created = list.find(
    (c) => c.type === "created" && String(c.objectType ?? "").includes("Vault"),
  );
  if (created?.objectId) return created.objectId;
  const any = list.find((c) => String(c.objectType ?? "").includes("Vault"));
  return any?.objectId ?? "";
}

switch (mode) {
  case "gas-total": {
    const coins = Array.isArray(data) ? data : [];
    const total = coins.reduce((sum, c) => sum + Number(c.mistBalance ?? 0), 0);
    process.stdout.write(String(total));
    break;
  }
  case "package-id": {
    const pub = (data.objectChanges ?? []).find((c) => c.type === "published");
    process.stdout.write(pub?.packageId ?? "");
    break;
  }
  case "vault-id":
    process.stdout.write(vaultId(data.objectChanges));
    break;
  case "admin-cap-id": {
    const cap = (data.objectChanges ?? []).find((c) =>
      String(c.objectType ?? "").includes("AdminCap"),
    );
    process.stdout.write(cap?.objectId ?? "");
    break;
  }
  default:
    console.error("Usage: sui-json.mjs <gas-total|package-id|vault-id|admin-cap-id> [json]");
    process.exit(1);
}
