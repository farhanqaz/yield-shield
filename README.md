# Yield Shield

Programmable money on Sui — Smart Save routes incoming funds in one atomic PTB (vault + liquid buffer). ShieldScore monitors risk via Pyth. Circuit breaker pauses deposits. Emergency Exit withdraws atomically.

Built for **Sui Overflow 2026** · **DeFi & Payments** track.

---

## Testnet

| | |
|---|---|
| **Package** | `0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d` |
| **Vault** | `0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83` |
| **Payment link** | `/save?amount=0.5` |

---

## Features

- **Smart Save PTB** — auto-split payment → guarded vault + liquid buffer (one transaction)
- **ShieldScore** — on-chain risk score (Safe / Caution / Paused)
- **Withdraw all** — atomic PTB back to wallet (always allowed)
- **Pyth** — SUI/USD feed + keeper sync to on-chain metrics

---

## Architecture

```
/save payment ──► Smart Save PTB [split → vault deposit + liquid return]
Pyth Hermes ──► keeper PTB ──► vault.update_metrics
Emergency Exit ──► PTB [withdraw all → wallet]
```

```
move/yield_shield/   Move contracts (vault, shield_score, receipt)
app/                 Next.js 15 + dApp Kit frontend
scripts/             Testnet deploy script
```

---

## Quick start

### Contracts

```bash
cd move/yield_shield && sui move test
```

Deploy (testnet):

```bash
./scripts/deploy-testnet.sh
```

Deploy (mainnet — requires funded wallet):

```bash
./scripts/deploy-mainnet.sh
```

Then update Vercel env vars and set `NEXT_PUBLIC_SUI_NETWORK=mainnet`.

### Frontend

```bash
cd app
cp .env.local.example .env.local   # fill package / vault IDs
npm install
npm run dev
```

### Deploy (Vercel)

1. Import this repo on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `app`
3. Add environment variables from `app/.env.local.example`
4. Deploy

---

## License

MIT
