# Yield Shield — Pitch Deck (6 slides)

> **Track:** DeFi & Payments · [Problem statement](https://mystenlabs.notion.site/defi-payments-problem-statement)  
> **Target:** Top 3 · stretch #1

---

## Slide 1 — Problem

**Headline:** Payments and DeFi are disconnected.

**Bullets:**
- Payments today = static transfers
- DeFi = complex, siloed, manual orchestration
- When risk spikes, users juggle multiple txs to exit — slow and error-prone

**Track quote:**
> *"On Sui, payments can become programmable financial actions."*

---

## Slide 2 — Solution

**Headline:** Yield Shield — programmable money with embedded guardrails.

**One-liner:**
Incoming funds auto-route via **Smart Save PTB** — guarded vault + liquid buffer in one atomic transaction.

**Plus:** ShieldScore circuit breaker · Pyth-driven risk · **Emergency Exit** PTB

---

## Slide 3 — Demo

**Screenshot:** `/save` payment page + Paused state + Emergency Exit

**Live flow (testnet):**
1. Open programmable payment link → **Smart Save** (split PTB)
2. ShieldScore **Safe** → Pyth sync or stress → **Paused**
3. **Emergency Exit** — withdraw all in one PTB

**Live URL:** `[vercel-url]`  
**Payment link:** `[vercel-url]/save?amount=0.5`

---

## Slide 4 — Architecture

```
/save payment ──► Smart Save PTB [split → vault + liquid]
Pyth Hermes ──► keeper PTB ──► vault.update_metrics
Emergency Exit ──► PTB [withdraw → wallet]
Mainnet option ──► Composable PTB [NAVI deposit + vault]
```

**Sui-native:** shared `Vault` · `ShieldReceipt` objects · Move 2024 · PTBs

**Package:** `0xdfd9...fc3d` · **Vault:** `0x04a7...f83`

---

## Slide 5 — Technical proof

| Item | Evidence |
|------|----------|
| Move contracts | Testnet deployed + unit tests |
| PTB composability | Smart Save split + Emergency Exit |
| Oracle integration | Pyth SUI/USD → on-chain ShieldScore |
| DeFi composability | NAVI SDK composable PTB (mainnet) |
| Open source | github.com/farhanqaz/yield-shield |

---

## Slide 6 — Vision

| Phase | Scope |
|-------|--------|
| **v1 (now)** | Smart Save + ShieldScore + Emergency Exit + Pyth |
| v2 | Mainnet + NAVI composable earn live |
| v3 | Multi-asset vaults + conditional payment rules |

**Close:** Programmable money that makes savings and exits automatic on Sui.

---

## Judging map

| Criterion | Evidence |
|-----------|----------|
| Financial use case | Payment → auto-save with risk rules |
| Asset handling | Move vault + receipt ownership |
| End-to-end flow | Live Vercel + testnet txs |
| Novel PTBs | Split deposit + atomic exit |
| UX | Payment link, gauge, one-click exit |
