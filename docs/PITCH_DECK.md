# Yield Shield — Pitch Deck (6 slides)

> **Track:** DeFi & Payments · Sui Overflow 2026  
> **Target:** Top 2 — optimize Real-World (50%) + Demo polish

---

## Slide 1 — Problem (Real-World 50%)

**Headline:** DeFi on Sui is powerful — but retail users panic when risk spikes.

**Bullets:**
- After ecosystem stress, many users hold idle SUI/stablecoins — afraid to deploy
- Manual rescue = multiple txs, slow, expensive gas
- No simple **programmable exit** when market volatility hits

**User quote (fill after interviews):**
> *"I want yield but I don't know when to get out."* — bootcamp builder, Superteam ID

---

## Slide 2 — Solution

**Headline:** Yield Shield — the DeFi seatbelt for Sui.

**One-liner:**
Programmable savings with on-chain ShieldScore + **Emergency Exit** in one atomic PTB.

**Not:** max APY aggregator · full insurance · unbuilt deleverage

---

## Slide 3 — Demo (Product & UX 20%)

**Screenshot:** Paused state + red Emergency Exit button + Score gauge

**Live flow (testnet):**
1. Deposit SUI → Safe (score ~100)
2. Keeper syncs Pyth volatility OR demo stress → **Paused**
3. **Emergency Exit** → withdraw all in one PTB

**Live URL:** `[your-vercel-url]`

---

## Slide 4 — Architecture (Technical 20%)

```
Pyth Hermes (SUI/USD) → keeper PTB → vault.update_metrics
User wallet → PTB [split → deposit → NAVI-ready supply]
Emergency Exit → PTB [withdraw → coin to wallet]
```

**Sui-native:**
- Shared `Vault` object + `ShieldReceipt`
- Programmable Transaction Blocks (atomic)
- Move 2024 · testnet deployed

**Package:** `0xdfd9...fc3d` · **Vault:** `0x04a7...f83`

---

## Slide 5 — Traction & validation

- Testnet deploy + working Next.js dashboard
- 5 problem interviews (bootcamp / Superteam)
- Built during **Mancer × Superteam** bootcamp
- Move unit tests passing

---

## Slide 6 — Vision (Presentation 10%)

| Phase | Scope |
|-------|--------|
| **v1 (now)** | ShieldScore + pause + Emergency Exit + Pyth |
| v2 | NAVI supply integration + borrower health read |
| v3 | Full PTB deleverage (withdraw → Cetus → repay) |

**Ask:** Top 4 DeFi track — programmable safety rail for Sui retail.

---

## Judging rubric map

| Rubric | How we score |
|--------|----------------|
| Real-World 50% | Fear + manual orchestration + SEA retail persona |
| UX 20% | Gauge, Emergency Exit hero, Vercel live |
| Technical 20% | Pyth + PTB + Move on testnet |
| Presentation 10% | This deck + 5-min video |
