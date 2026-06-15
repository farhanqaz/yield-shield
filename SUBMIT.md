# Yield Shield — Hackathon submission pack

Copy-paste untuk **Sui Overflow 2026 / DeepSurge**.

---

## Links

| | URL |
|---|---|
| **Live app** | https://yield-shield-kappa.vercel.app |
| **GitHub** | https://github.com/farhanqaz/yield-shield |
| **Track** | DeFi & Payments |

---

## Mainnet contracts (production)

| | ID |
|---|---|
| **Package** | `0x35c0e90fc10845f1499300f71cc60e7e3809ca9dfb83b7b6ec6a90f170392acf` |
| **Vault** | `0x433a2c1702cef0639e8f21c9f17a84a652f04069300e0b7d007755173c160c7c` |
| **Explorer** | https://suiscan.xyz/mainnet/object/0x433a2c1702cef0639e8f21c9f17a84a652f04069300e0b7d007755173c160c7c |

---

## Testnet contracts

| | ID |
|---|---|
| **Package** | `0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d` |
| **Vault** | `0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83` |
| **Explorer** | https://suiscan.xyz/testnet/object/0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83 |

---

## One-liner (project description)

> Yield Shield is programmable savings on Sui: **Smart Save** splits incoming SUI in one atomic PTB (guarded vault + liquid wallet buffer), while **ShieldScore** acts as an on-chain circuit breaker that pauses new deposits under stress — withdrawals always work.

---

## Full description (form / README)

**Problem:** Users want to save automatically without locking everything — and DeFi vaults rarely expose programmable payment flows or risk guardrails in one transaction.

**Solution:** Yield Shield lets anyone save with a custom split (50–95% vault / rest liquid) in a **single Programmable Transaction Block**. Funds enter a shared on-chain vault with receipt-based accounting. **ShieldScore** (0–100) combines utilization, volatility, and health buffer; when score drops below 30, new deposits pause — but users can always withdraw.

**Highlights:**
- One-tx Smart Save PTB (`split coins → vault.deposit → return liquid`)
- Payment links: `/?amount=0.5&vault=70` for programmable inbound flows
- Live Pyth SUI/USD price in UI
- On-chain ShieldScore with Safe / Caution / Paused states
- Next.js 15 + Sui dApp Kit frontend, Move contracts with unit tests

**Demo:** Connect wallet on Sui testnet → set split → Save → view portfolio chart → Withdraw. Optional: stress demo (deployer) shows circuit breaker.

**Roadmap:** NAVI yield composability (mainnet), automated keeper for metrics.

---

## Demo video script (~2 min)

1. **Intro (15s)** — "Yield Shield: programmable savings on Sui."
2. **Connect** — Open https://yield-shield-kappa.vercel.app, connect Sui wallet on **testnet**.
3. **Smart Save (45s)** — Set 70/30 split, amount 0.1 SUI → click **Save** → open Suiscan tx → show vault + wallet split in one PTB.
4. **Portfolio (20s)** — Point at chart: vault balance up, liquid portion in wallet.
5. **Withdraw (20s)** — Partial withdraw → confirm always works.
6. **Payment link (15s)** — Open `/?amount=0.5&vault=80` → preset amount + split.
7. **ShieldScore (15s)** — Show gauge; optional stress test if deployer wallet.
8. **Outro (10s)** — Repo link, package ID, "built for Sui Overflow 2026."

---

## Vercel env vars (mainnet — production)

```
NEXT_PUBLIC_PACKAGE_ID=0x35c0e90fc10845f1499300f71cc60e7e3809ca9dfb83b7b6ec6a90f170392acf
NEXT_PUBLIC_VAULT_ID=0x433a2c1702cef0639e8f21c9f17a84a652f04069300e0b7d007755173c160c7c
NEXT_PUBLIC_ADMIN_CAP_ID=0x7726edb3ead6644dca0f68143a001f7f5cc832e6185f5a01b5124adffff8d8e6
NEXT_PUBLIC_COIN_TYPE=0x2::sui::SUI
NEXT_PUBLIC_SMART_SAVE_VAULT_BPS=8500
NEXT_PUBLIC_ENABLE_NAVI=true
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_AUTO_SHIELD_KEEPER=true
```

Server-only: `KEEPER_PRIVATE_KEY`, `CRON_SECRET`

Root directory on Vercel: **`app`**

---

## Vercel env vars (testnet)

```
NEXT_PUBLIC_PACKAGE_ID=0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d
NEXT_PUBLIC_VAULT_ID=0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83
NEXT_PUBLIC_ADMIN_CAP_ID=0xa88329c9d2e90050e7f99b7733de3e6f5edf7d96ff54b673aa3914fd5675291d
NEXT_PUBLIC_COIN_TYPE=0x2::sui::SUI
NEXT_PUBLIC_SMART_SAVE_VAULT_BPS=8500
NEXT_PUBLIC_ENABLE_NAVI=false
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Root directory on Vercel: **`app`**

---

## Mainnet (after deploy)

Run when wallet has mainnet SUI:

```bash
./scripts/check-mainnet-ready.sh
./scripts/deploy-mainnet.sh
```

Then replace Vercel env with output from `app/.env.local` and set `NEXT_PUBLIC_SUI_NETWORK=mainnet`. Redeploy.

---

## Submit checklist

- [x] Contracts deployed (testnet + mainnet)
- [x] NAVI yield composability (mainnet)
- [x] ShieldScore auto-keeper (Pyth + NAVI metrics)
- [x] Move tests pass
- [x] Frontend build passes
- [ ] Vercel redeploy with mainnet env
- [ ] Record demo video (script above)
- [ ] Upload video + submit form on DeepSurge

**Deployer wallet (mainnet):** `0xe870454b3dfb18f8126e4c26a28243adaf3f70b886d30b124477318540654bfb`
