# Yield Shield

Programmable money on Sui — **Smart Save** splits incoming SUI in one atomic PTB (guarded vault + liquid wallet buffer). **ShieldScore** is an on-chain circuit breaker that pauses new deposits when risk is high. Withdrawals always work.

Built for **Sui Overflow 2026** · **DeFi & Payments** track.

---

## Live demo

| | |
|---|---|
| **App** | https://yield-shield-kappa.vercel.app |
| **GitHub** | https://github.com/farhanqaz/yield-shield |
| **Network** | Sui **mainnet** (NAVI yield) · testnet also supported |
| **Payment link** | `/?amount=0.5` or `/save?amount=0.5` |
| **Custom split** | `/?amount=0.5&vault=70` (70% vault, 30% wallet) |

> **Vercel:** root directory must be `app`. If the live URL 404s, redeploy with env vars from [SUBMIT.md](./SUBMIT.md).

---

## Mainnet contracts (production)

| | |
|---|---|
| **Package** | `0x35c0e90fc10845f1499300f71cc60e7e3809ca9dfb83b7b6ec6a90f170392acf` |
| **Vault** | `0x433a2c1702cef0639e8f21c9f17a84a652f04069300e0b7d007755173c160c7c` |
| **Explorer** | [Vault on Suiscan](https://suiscan.xyz/mainnet/object/0x433a2c1702cef0639e8f21c9f17a84a652f04069300e0b7d007755173c160c7c) |

---

## Testnet contracts

| | |
|---|---|
| **Package** | `0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d` |
| **Vault** | `0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83` |
| **AdminCap** | `0xa88329c9d2e90050e7f99b7733de3e6f5edf7d96ff54b673aa3914fd5675291d` |
| **Explorer** | [Vault on Suiscan](https://suiscan.xyz/testnet/object/0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83) |

---

## What it does

1. **Smart Save** — user sets a vault / wallet split (50–95%). One transaction splits SUI, deposits the vault portion, returns the rest to the wallet.
2. **ShieldScore** — on-chain score (0–100) with status Safe / Caution / Paused. Paused blocks new deposits only.
3. **Withdraw** — partial or full withdraw from vault back to wallet (always allowed).
4. **Pyth** — live SUI/USD price in the UI.

**Roadmap (not in this MVP):** NAVI yield composability, automated keeper for ShieldScore metrics.

---

## Priority roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| **1** | Real yield via **NAVI** (mainnet) | ✅ PTB composability — `ENABLE_NAVI=true` |
| **2** | **ShieldScore auto** from Pyth + pool metrics | ✅ Keeper API + cron |
| **3** | Mainnet deploy | Nice to have — script ready |

### NAVI yield (mainnet)

Smart Save vault % → **NAVI lending** in one PTB (`depositCoinPTB`). Withdraw via `withdrawCoinPTB`. APY shown in UI.

```env
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_ENABLE_NAVI=true
```

Requires mainnet wallet + deployed Yield Shield vault (for ShieldScore circuit breaker).

### Auto ShieldScore keeper

Server pushes Pyth volatility (+ NAVI pool utilization on mainnet) to `vault::update_metrics`.

**Local setup (testnet, ~0.001 SUI per sync):**

```bash
./scripts/setup-keeper.sh   # writes KEEPER_PRIVATE_KEY to app/.env.local
cd app && npm run dev
./scripts/test-keeper.sh    # should return ok: true + digest
```

```env
NEXT_PUBLIC_AUTO_SHIELD_KEEPER=true
KEEPER_PRIVATE_KEY=suiprivkey...   # deployer with AdminCap (server only, never commit)
CRON_SECRET=...                  # Vercel production cron auth
```

Works on **testnet** without mainnet gas or NAVI.

---

## Demo script (~2 min)

1. Open https://yield-shield-kappa.vercel.app → connect wallet on **Sui testnet** (faucet SUI if needed).
2. Set split (e.g. 70/30) and amount (e.g. `0.1` SUI) → click **Save** → show one transaction on Suiscan.
3. Point at **portfolio chart** — vault balance increased, wallet kept liquid portion.
4. **Withdraw** a small amount → confirm it works.
5. *(Optional)* Open `/?amount=0.5&vault=80` → show programmable payment link with preset amount and split.
6. *(Optional, deployer wallet)* Demo controls → stress test → deposits pause → withdraw still works.

Full submission copy: **[SUBMIT.md](./SUBMIT.md)**

---

## Architecture

```
User Save PTB ──► split coins ──► vault.deposit + return liquid to wallet
Pyth Hermes ──► UI price (testnet beta feed)
Admin / demo ──► vault.update_metrics ──► ShieldScore refresh
Withdraw PTB ──► vault.withdraw ──► wallet
```

```
move/yield_shield/   Move: vault, shield_score, receipt, navi_adapter (mock)
app/                 Next.js 15 + dApp Kit
scripts/             deploy-testnet.sh, deploy-mainnet.sh, check-mainnet-ready.sh
```

---

## Quick start

### Contracts

```bash
cd move/yield_shield && sui move test
```

Deploy testnet:

```bash
./scripts/deploy-testnet.sh
```

### Frontend

```bash
cd app
cp .env.local.example .env.local   # or use values from SUBMIT.md
npm install
npm run dev
```

### Vercel

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. **Root Directory:** `app`
3. Environment variables — copy block from [SUBMIT.md](./SUBMIT.md)
4. `NEXT_PUBLIC_SUI_NETWORK=testnet` (or `mainnet` after mainnet deploy)
5. Deploy

---

## Mainnet deploy

**Prerequisite:** ~0.5–2 SUI on deployer wallet (mainnet).

```bash
# 1. Check wallet
./scripts/check-mainnet-ready.sh

# 2. Deploy contracts + write app/.env.local
./scripts/deploy-mainnet.sh

# 3. Test locally
cd app && npm run dev

# 4. Update Vercel env vars from .env.local → Redeploy
```

| Setting | Value |
|---------|--------|
| `NEXT_PUBLIC_SUI_NETWORK` | `mainnet` |
| Demo stress controls | Hidden automatically |
| Pyth feed | Auto (Hermes stable) |
| NAVI yield | Still mock — `ENABLE_NAVI=false` |

**Deployer wallet:** `0xe870454b3dfb18f8126e4c26a28243adaf3f70b886d30b124477318540654bfb`

---

## Submit checklist

- [x] Contracts deployed (testnet)
- [x] Move tests pass (`sui move test`)
- [x] Frontend build passes (`npm run build`)
- [x] Live URL on Vercel
- [ ] Record demo video ([script](./SUBMIT.md#demo-video-script-2-min))
- [ ] Submit to DeepSurge (copy from [SUBMIT.md](./SUBMIT.md))
- [ ] Mainnet deploy (optional — fund deployer wallet, run `./scripts/deploy-mainnet.sh`)

---

## License

MIT
