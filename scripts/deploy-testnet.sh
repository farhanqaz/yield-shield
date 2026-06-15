#!/usr/bin/env bash
# Deploy Yield Shield to Sui testnet and print env vars for app/.env.local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOVE_DIR="$ROOT/move/yield_shield"
ENV_FILE="$ROOT/app/.env.local"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v sui >/dev/null; then
  echo "Install Sui CLI first:"
  echo "  curl -fsSL https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh"
  echo "  suiup install sui"
  exit 1
fi

sui client switch --env testnet 2>/dev/null || true

echo "==> Building & testing Move package"
cd "$MOVE_DIR"
sui move test
sui move build

echo "==> Publishing package"
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
NEXT_PUBLIC_SUI_NETWORK=testnet
EOF

echo ""
echo "Wrote $ENV_FILE"
echo "Restart Next.js: cd app && npm run dev"
echo "Copy the same env vars to Vercel → Settings → Environment Variables"
cat "$ENV_FILE"
