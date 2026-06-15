# Yield Shield

**Programmable money on Sui** — Smart Save routes incoming funds in one atomic PTB (vault + liquid buffer). ShieldScore monitors risk via Pyth. Circuit breaker pauses deposits. Emergency Exit withdraws atomically.

**Sui Overflow 2026** · **DeFi & Payments** track

> *Make money move smarter — [official track brief](https://mystenlabs.notion.site/defi-payments-problem-statement)*

---

## Live (testnet)

| | |
|---|---|
| **Package** | `0xdfd9c33e3d5e3bbddf3e353938ebeff3951df7cda7225c018668bd87f7e2fc3d` |
| **Vault** | `0x04a78c1a006adaa7f09be41c8341c0ae5c5fbc31d842449c77eeb8236e187f83` |
| **GitHub** | [farhanqaz/yield-shield](https://github.com/farhanqaz/yield-shield) |
| **Frontend** | [Deploy via GitHub + Vercel](./docs/GITHUB_DEPLOY.md) (root: `app/`) |
| **Payment link** | `/save?amount=0.5` — programmable payment → auto-save |

---

## Track alignment (DeFi & Payments)

| Official criterion | Yield Shield |
|--------------------|--------------|
| Programmable payments | Smart Save PTB splits payment → vault + liquid in one tx |
| Vaults & capital management | Shared `Vault` + `ShieldReceipt` share accounting |
| Financial automation | ShieldScore circuit breaker (Safe / Caution / Paused) |
| Novel PTBs | Deposit + split + exit bundled atomically; optional NAVI composable PTB |
| Composability | Move modules + NAVI SDK + Pyth keeper |

---

## Features

| Feature | Status |
|---------|--------|
| Smart Save PTB (auto-allocate) | Live |
| ShieldScore + circuit breaker | On-chain |
| Emergency Exit (PTB withdraw all) | Live |
| Pyth SUI/USD + keeper sync | Live |
| Programmable payment page `/save` | Live |
| NAVI composable earn PTB | Mainnet (`NEXT_PUBLIC_ENABLE_NAVI=true`) |
| Move unit tests | Passing |

---

## Architecture

```
Payment link /save ──► Smart Save PTB [split → vault deposit + liquid return]
Pyth Hermes ──► keeper PTB ──► vault.update_metrics
Emergency Exit ──► PTB [withdraw → coin to wallet]
Optional mainnet ──► Composable PTB [NAVI deposit + vault deposit]
```

---

## Quick start

```bash
cd move/yield_shield && sui move test
cd app && cp .env.local.example .env.local && npm install && npm run dev
```

See [GITHUB_DEPLOY.md](./docs/GITHUB_DEPLOY.md) for Vercel.

---

## Docs

- [Win strategy](./docs/WIN_STRATEGY.md)
- [Pitch deck](./docs/PITCH_DECK.md)
- [Demo script](./docs/DEMO_SCRIPT.md)
- [Submission checklist](./docs/SUBMISSION_CHECKLIST.md)
- [Track alignment](./docs/TRACK_ALIGNMENT.md)

---

## License

MIT
