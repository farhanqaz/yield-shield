#!/usr/bin/env bash
# Write KEEPER_PRIVATE_KEY into app/.env.local (testnet deployer with AdminCap).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/app/.env.local"

sui client switch --env testnet >/dev/null
ADDR=$(sui client active-address)

echo "Keeper wallet (testnet): $ADDR"

GAS=$(sui client gas 2>/dev/null | grep -oP '\d+\.\d+(?= SUI)' | head -1 || echo "0")
if awk "BEGIN { exit !($GAS < 0.01) }" 2>/dev/null; then
  echo "⚠️  Low testnet SUI ($GAS) — faucet if keeper txs fail"
fi

# Export suiprivkey (JSON)
EXPORTED=$(sui keytool export --key-identity "$ADDR" --json 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.exportedPrivateKey||'')")
if [ -z "$EXPORTED" ]; then
  echo "❌ Could not export key. Run: sui keytool export --key-identity $ADDR"
  exit 1
fi

touch "$ENV_FILE"

# Remove old keeper lines
grep -v '^KEEPER_PRIVATE_KEY=' "$ENV_FILE" | grep -v '^NEXT_PUBLIC_AUTO_SHIELD_KEEPER=' | grep -v '^CRON_SECRET=' > "${ENV_FILE}.tmp" || true
mv "${ENV_FILE}.tmp" "$ENV_FILE"

{
  echo "NEXT_PUBLIC_AUTO_SHIELD_KEEPER=true"
  echo "KEEPER_PRIVATE_KEY=$EXPORTED"
  echo "CRON_SECRET=local-keeper-dev"
} >> "$ENV_FILE"

echo "✅ Wrote keeper env to app/.env.local"
echo "   NEXT_PUBLIC_AUTO_SHIELD_KEEPER=true"
echo "   KEEPER_PRIVATE_KEY=*** (hidden)"
echo ""
echo "Test: ./scripts/test-keeper.sh"
echo "Vercel: copy KEEPER_PRIVATE_KEY + CRON_SECRET to project env (server-only)"
