#!/usr/bin/env bash
# Deploy Yield Shield to Sui mainnet and print env vars for app/.env.local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOVE_DIR="$ROOT/move/yield_shield"
ENV_FILE="$ROOT/app/.env.local"
MIN_SUI_MIST=500000000  # ~0.5 SUI for publish + create_vault

if ! command -v sui >/dev/null; then
  echo "Install Sui CLI: https://docs.sui.io/guides/developer/getting-started/sui-install"
  exit 1
fi

sui client switch --env mainnet

ADDR=$(sui client active-address)
echo "Mainnet wallet: $ADDR"

GAS_JSON=$(sui client gas --json 2>/dev/null || echo "[]")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOTAL_MIST=$(node "$SCRIPT_DIR/sui-json.mjs" gas-total "$GAS_JSON")

if [ "$TOTAL_MIST" -lt "$MIN_SUI_MIST" ]; then
  echo ""
  echo "❌ Not enough mainnet SUI for deploy."
  echo "   Need at least ~0.5 SUI on: $ADDR"
  echo "   Current: $(awk "BEGIN { printf \"%.4f\", $TOTAL_MIST / 1000000000 }") SUI"
  echo ""
  echo "   Send mainnet SUI to this address, then re-run:"
  echo "   ./scripts/deploy-mainnet.sh"
  exit 1
fi

echo "Gas OK: $(awk "BEGIN { printf \"%.4f\", $TOTAL_MIST / 1000000000 }") SUI"
echo ""
echo "⚠️  MAINNET deploy — uses real SUI."

if [ "${DEPLOY_CONFIRM:-}" != "yes" ]; then
  read -r -p "Continue? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo "==> Building & testing Move package"
cd "$MOVE_DIR"
sui move test
sui move build

echo "==> Publishing package on mainnet"
PUBLISH_OUT=$(sui client publish --gas-budget 200000000 --json)
PACKAGE_ID=$(node "$SCRIPT_DIR/sui-json.mjs" package-id "$PUBLISH_OUT")
echo "Package ID: $PACKAGE_ID"

echo "==> Creating vault (SUI)"
CALL_OUT=$(sui client call \
  --package "$PACKAGE_ID" \
  --module vault \
  --function create_vault \
  --type-args "0x2::sui::SUI" \
  --gas-budget 100000000 \
  --json)

VAULT_ID=$(node "$SCRIPT_DIR/sui-json.mjs" vault-id "$CALL_OUT")
ADMIN_CAP_ID=$(node "$SCRIPT_DIR/sui-json.mjs" admin-cap-id "$CALL_OUT")

cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID
NEXT_PUBLIC_VAULT_ID=$VAULT_ID
NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID
NEXT_PUBLIC_COIN_TYPE=0x2::sui::SUI
NEXT_PUBLIC_SMART_SAVE_VAULT_BPS=8500
NEXT_PUBLIC_ENABLE_NAVI=false
NEXT_PUBLIC_SUI_NETWORK=mainnet
EOF

echo ""
echo "✅ Mainnet deploy complete"
echo "Wrote $ENV_FILE"
echo ""
echo "Next steps:"
echo "  1. cd app && npm run dev   # test locally on mainnet"
echo "  2. Vercel → Settings → Environment Variables → paste values below"
echo "  3. Vercel → Redeploy"
echo "  4. Wallet must be on MAINNET to use the app"
echo ""
cat "$ENV_FILE"
echo ""
echo "Vault explorer: https://suiscan.xyz/mainnet/object/$VAULT_ID"
