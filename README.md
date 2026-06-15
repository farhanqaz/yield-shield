# Yield Shield

**Programmable DeFi safety rail on Sui** — ShieldScore monitors risk (Pyth-powered), circuit breaker pauses new deposits, and **Emergency Exit** withdraws your position in one atomic PTB.

Built for **Sui Overflow 2026** · **DeFi & Payments** track · Mancer × Superteam bootcamp.

> *The DeFi seatbelt for Sui — earn with guardrails, exit in one click.*

---

## Live (testnet)

| | |
|---|---|
| **Package** | `0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d` |
| **Vault** | `0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83` |
| **Frontend** | Deploy via [GitHub + Vercel](./docs/GITHUB_DEPLOY.md) (root: `app/`) |

---

## Judging rubric alignment

| Rubric | How Yield Shield delivers |
|--------|---------------------------|
| **Real-World 50%** | Retail fear post-volatility; programmable exit vs manual multi-tx |
| **UX 20%** | ShieldScore gauge, Emergency Exit hero, Pyth live price |
| **Technical 20%** | Move vault testnet + PTB + Pyth Hermes → keeper `update_metrics` |
| **Presentation 10%** | [Pitch deck](./docs/PITCH_DECK.md) + [demo script](./docs/DEMO_SCRIPT.md) |

---

## Features

| Feature | Status |
|---------|--------|
| ShieldScore + Safe / Caution / Paused | On-chain |
| Emergency Exit (PTB withdraw all) | Live |
| Pyth SUI/USD feed (Hermes) | Live in UI |
| Keeper sync → on-chain volatility | Admin PTB |
| Vault deposit | Testnet |
| NAVI supply | Adapter mock (v2) |

---

## Architecture

```
Pyth Hermes ──► frontend ──► keeper PTB ──► vault.update_metrics
User wallet ──► PTB [split SUI → deposit → supply layer]
Emergency Exit ──► PTB [withdraw → coin to wallet]
```

```
move/yield_shield/     Vault, ShieldScore, receipt
app/                   Next.js 15 + dApp Kit
docs/                  Pitch, demo, track alignment
.cursor/sui-pilot/      Hackathon-recommended Sui dev skill
```

---

## Quick start

### Move

```bash
cd move/yield_shield && sui move test
./scripts/deploy-testnet.sh   # from repo root
```

### Frontend

```bash
cd app && cp .env.local.example .env.local  # or use deploy script output
npm install && npm run dev
```

### Vercel

1. Import repo → root directory **`app`**
2. Add env vars from `.env.local`
3. Deploy

---

## Docs

- [Pitch deck (6 slides)](./docs/PITCH_DECK.md)
- [Demo video script](./docs/DEMO_SCRIPT.md)
- [Track alignment](./docs/TRACK_ALIGNMENT.md)
- [MVP spec](./docs/MVP_SPEC.md)
- [GitHub + Vercel deploy](./docs/GITHUB_DEPLOY.md)
- [Interview template](./docs/INTERVIEW_TEMPLATE.md)

---

## License

MIT
