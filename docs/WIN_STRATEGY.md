# Win Strategy — Sui Overflow 2026 (DeFi & Payments)

Target: **Top 3 minimum** · stretch **#1**

Sources: [DeFi problem statement](https://mystenlabs.notion.site/defi-payments-problem-statement) · [Overflow handbook](https://mystenlabs.notion.site/overflow-2026-handbook) · Deadline **21 Jun 2026**

---

## What judges score

| Dimension | Weight (approx) | Our weapon |
|-----------|-----------------|------------|
| Problem / real-world | High | Programmable save vs static transfer + manual DeFi orchestration |
| Product & UX | High | Smart Save button, payment link, gauge, Emergency Exit |
| Technical / Sui depth | High | Move vault + PTBs + Pyth + NAVI composable (mainnet) |
| Presentation | Medium | 5-min video + pitch deck |

Overflow emphasizes **production-ready apps** and **meaningful financial flows**, not toy contracts.

---

## Differentiators (why not another vault)

1. **Smart Save PTB** — payment auto-splits to guarded vault + liquid buffer (one signature)
2. **Payment entry** — `/save?amount=X` shareable link (payments → financial action)
3. **ShieldScore circuit breaker** — on-chain rules, auditable Move
4. **Emergency Exit** — atomic withdraw when Paused
5. **NAVI composable PTB** — optional mainnet: NAVI supply + vault in single tx

---

## Submission package (must-have)

- [ ] Public GitHub: https://github.com/farhanqaz/yield-shield
- [ ] Vercel live URL (root `app/`)
- [ ] Demo video ≤5 min ([script](./DEMO_SCRIPT.md))
- [ ] Pitch deck PDF or [PITCH_DECK.md](./PITCH_DECK.md)
- [ ] 2+ explorer tx links in video description
- [ ] README explains use case in plain language

---

## Demo video beats (non-negotiable)

1. Problem: static payments vs programmable money (15s)
2. Open `/save?amount=0.5` → Smart Save PTB → explorer (60s)
3. ShieldScore Safe → stress/Pyth sync → Paused (45s)
4. Emergency Exit → one PTB (30s)
5. Architecture: objects + PTBs + Pyth (30s)
6. Roadmap: NAVI mainnet composable (15s)

Rehearse **3×**, pick best take.

---

## Prize tiers (DeFi track)

| Place | Prize |
|-------|-------|
| 1st | $30,000 |
| 2nd | $15,000 |
| 3rd | $7,500 |
| 4th | $5,000 |

50% paid on win; remainder on **mainnet deploy** by Aug 27 — plan mainnet path for full payout.

---

## 6-day execution order

| Day | Focus |
|-----|--------|
| 1 | Vercel prod + env verified |
| 2 | Demo video recorded |
| 3 | Pitch deck export + README polish |
| 4 | Mainnet deploy + `ENABLE_NAVI` (optional, boosts technical score) |
| 5 | Mobile QA + payment link test |
| 6 | Submit on DeepSurge + buffer |

---

## Do not waste time on

- User interviews (optional, not required)
- Full deleverage (Cetus → repay) — out of scope
- Rebuilding from scratch
- Multiple tracks — stay **DeFi & Payments**
