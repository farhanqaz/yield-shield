#!/usr/bin/env bash
# Check if wallet is ready for mainnet deploy
set -euo pipefail

if ! command -v sui >/dev/null; then
  echo "❌ sui CLI not installed"
  exit 1
fi

sui client switch --env mainnet >/dev/null
ADDR=$(sui client active-address)
GAS_JSON=$(sui client gas --json 2>/dev/null || echo "[]")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOTAL_MIST=$(node "$SCRIPT_DIR/sui-json.mjs" gas-total "$GAS_JSON")
SUI=$(awk "BEGIN { printf \"%.4f\", $TOTAL_MIST / 1000000000 }")

echo "Network:  mainnet"
echo "Wallet:   $ADDR"
echo "Balance:  $SUI SUI"

if [ "$TOTAL_MIST" -ge 500000000 ]; then
  echo "Status:   ✅ Ready to deploy (./scripts/deploy-mainnet.sh)"
else
  echo "Status:   ❌ Need ~0.5 SUI mainnet on this wallet"
  echo "          Send SUI then re-run this script"
fi
