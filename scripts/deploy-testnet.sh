#!/usr/bin/env bash
# Deploy Yield Shield to Sui testnet and print env vars for app/.env.local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOVE_DIR="$ROOT/move/yield_shield"
ENV_FILE="$ROOT/app/.env.local"

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
PACKAGE_ID=$(echo "$PUBLISH_OUT" | jq -r '.objectChanges[] | select(.type=="published") | .packageId')

echo "Package ID: $PACKAGE_ID"

echo "==> Creating vault (SUI)"
CALL_OUT=$(sui client call \
  --package "$PACKAGE_ID" \
  --module vault \
  --function create_vault \
  --type-args "0x2::sui::SUI" \
  --gas-budget 100000000 \
  --json)

VAULT_ID=$(echo "$CALL_OUT" | jq -r '.objectChanges[] | select(.objectType | contains("Vault")) | select(.type=="created") | .objectId' | head -1)
ADMIN_CAP_ID=$(echo "$CALL_OUT" | jq -r '.objectChanges[] | select(.objectType | contains("AdminCap")) | .objectId' | head -1)

# shared object shows as mutated sometimes
if [ -z "$VAULT_ID" ] || [ "$VAULT_ID" = "null" ]; then
  VAULT_ID=$(echo "$CALL_OUT" | jq -r '.objectChanges[] | select(.objectType | contains("Vault")) | .objectId' | head -1)
fi

cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID
NEXT_PUBLIC_VAULT_ID=$VAULT_ID
NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID
NEXT_PUBLIC_COIN_TYPE=0x2::sui::SUI
EOF

echo ""
echo "Wrote $ENV_FILE"
echo "Restart Next.js: cd app && npm run dev"
cat "$ENV_FILE"
