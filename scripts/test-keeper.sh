#!/usr/bin/env bash
# Hit local keeper API (dev server must be running: cd app && npm run dev)
set -euo pipefail

URL="${1:-http://localhost:3000/api/keeper/sync}"
SECRET="${CRON_SECRET:-local-keeper-dev}"

echo "POST $URL"
RES=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json")

BODY=$(echo "$RES" | head -n -1)
CODE=$(echo "$RES" | tail -n 1)

echo "$BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.stringify(JSON.parse(d),null,2))}catch{console.log(d)}})"

if [ "$CODE" = "200" ]; then
  echo "✅ Keeper sync OK (HTTP $CODE)"
else
  echo "❌ HTTP $CODE"
  exit 1
fi
