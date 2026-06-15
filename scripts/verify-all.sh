#!/usr/bin/env bash
# One-shot: verify project health + mainnet readiness
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Move tests"
(cd move/yield_shield && sui move test)

echo ""
echo "==> Frontend build"
(cd app && npm run build)

echo ""
echo "==> Mainnet readiness"
./scripts/check-mainnet-ready.sh

echo ""
echo "==> Local env"
if [ -f app/.env.local ]; then
  grep -E '^NEXT_PUBLIC_' app/.env.local | sed 's/=.*/=***/' || true
  echo "(values hidden — see app/.env.local)"
else
  echo "❌ app/.env.local missing — run ./scripts/deploy-testnet.sh"
fi

echo ""
echo "==> Live URL"
URL="https://yield-shield-kappa.vercel.app"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
if [ "$CODE" = "200" ]; then
  echo "✅ $URL ($CODE)"
else
  echo "⚠️  $URL returned HTTP $CODE"
  echo "   Fix: Vercel → root directory app → env from SUBMIT.md → Redeploy"
fi

echo ""
echo "Done. Submission pack: SUBMIT.md"
