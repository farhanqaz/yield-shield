# Yield Shield

Programmable money on Sui — **Smart Save** splits incoming SUI in one atomic PTB (guarded vault + liquid buffer). **ShieldScore** is an on-chain circuit breaker that pauses new deposits when risk is high. Withdrawals always work.

Built for **Sui Overflow 2026** · **DeFi & Payments** track.

---

## Live demo

| | |
|---|---|
| **App** | Deploy on Vercel (root directory: `app`) |
| **Network** | Sui testnet |
| **Payment link** | `/?amount=0.5` or `/save?amount=0.5` |
| **Custom split** | `/?amount=0.5&vault=70` (70% vault, 30% wallet) |

---

## Testnet contracts

| | |
|---|---|
| **Package** | `0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d` |
| **Vault** | `0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83` |
| **Explorer** | [Vault on Suiscan](https://suiscan.xyz/testnet/object/0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83) |

---

## What it does

1. **Smart Save** — user sets a vault / wallet split (50–95%). One transaction splits SUI, deposits the vault portion, returns the rest to the wallet.
2. **ShieldScore** — on-chain score (0–100) with status Safe / Caution / Paused. Paused blocks new deposits only.
3. **Withdraw** — partial or full withdraw from vault back to wallet (always allowed).
4. **Pyth** — live SUI/USD price in the UI.

**Roadmap (not in this MVP):** NAVI yield composability, automated keeper for ShieldScore metrics.

---

## Demo script (~2 min)

1. Open the app → connect wallet on **Sui testnet** (faucet SUI if needed).
2. Set split (e.g. 70/30) and amount (e.g. `0.1` SUI) → click **Save** → show one transaction on Suiscan.
3. Point at **portfolio chart** — vault balance increased, wallet kept liquid portion.
4. **Withdraw** a small amount → confirm it works.
5. *(Optional)* Open `/?amount=0.5&vault=80` → show programmable payment link with preset amount and split.
6. *(Optional, deployer wallet)* Demo controls → stress test → deposits pause → withdraw still works.

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
scripts/             deploy-testnet.sh
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
cp .env.local.example .env.local
npm install
npm run dev
```

### Vercel

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. **Root Directory:** `app`
3. Environment variables from `app/.env.local.example` (use your package / vault IDs)
4. `NEXT_PUBLIC_SUI_NETWORK=testnet`
5. Deploy

---

## Submit checklist

- [ ] Vercel live URL works on testnet
- [ ] Record demo video (script above)
- [ ] Submit to DeepSurge with repo + live link + package ID
- [ ] Wallet on testnet with SUI for live demo

---

## License

MIT
