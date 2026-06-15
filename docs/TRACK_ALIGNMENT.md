# Yield Shield × DeFi & Payments Track Alignment

> **Track:** DeFi & Payments — *Programmable Money, Payments & Financial Systems on Sui*  
> **Hackathon:** [Sui Overflow 2026](https://overflow.sui.io/)

---

## Problem we solve (track framing)

The track states that **payments and DeFi are disconnected** — users manually orchestrate transfers, savings, and yield.

**Yield Shield** closes that gap for retail users:

| Track pain point | Yield Shield answer |
|------------------|---------------------|
| Payments are static transfers | Deposit USDC → **programmable financial action** (supply + risk rules) |
| DeFi is complex and siloed | One vault abstracts NAVI + risk logic behind Safe / Caution / Paused |
| Users manually orchestrate | **PTB** bundles deposit → supply → score check atomically |

**One-liner (track-native):**

> *Programmable savings — USDC that earns yield on NAVI and automatically pauses when on-chain risk signals cross a threshold.*

---

## Idea bank mapping

We sit at the intersection of two flavors from the official idea bank:

### Vaults & Capital Management
- Yield vault with rule-based capital protection
- Automated savings strategy (supply when safe, pause when not)

### Financial Automation
- Rule-driven circuit breaker (ShieldScore thresholds)
- Conditional execution: deposits blocked when score < 30

### Secondary pitch angle — Payments & Consumer Finance
- **TabungShield persona:** freelancer receives USDC → one-click programmable savings with guardrails (real-world applicability for judges)

---

## Core building blocks used

| Building block | How Yield Shield uses it |
|----------------|--------------------------|
| **Sui Move** | `Vault` shared object, typed USDC flows, `ShieldReceipt` ownership |
| **PTBs** | `pay → deposit → navi_supply → update_score` in one atomic tx |
| **Tokens & Assets** | USDC in/out; receipt objects as tokenized vault positions |
| **DeFi (optional)** | NAVI lending integration (primary); Pyth oracles for volatility signal |

---

## What a strong project demonstrates

| Criterion | Yield Shield evidence |
|-----------|----------------------|
| Clear financial use case | Retail yield with automatic risk guardrails |
| Correct asset / ownership handling | Coins flow through vault; receipts prove shares |
| End-to-end flow | zkLogin → deposit → earn → stress → pause → withdraw |
| Thoughtful user abstraction | Three states (Safe / Caution / Paused), not raw APY math |

---

## What a top-tier project demonstrates

| Criterion | Yield Shield plan |
|-----------|-------------------|
| Novel use of PTBs | Atomic multi-step: oracle read + NAVI action + vault state update |
| Strong composability | Vault module + `navi_adapter` + `shield_score` as separate Move modules |
| Excellent UX for complex actions | User sees one button; PTB handles orchestration |
| Real-world applicability | Post-exploit anxiety, bootcamp builders, SEA freelancers with idle USDC |

---

## Submission type

**Full-stack application** + **Move smart contract system**

- `move/yield_shield/` — on-chain vault, score, adapter
- `app/` — React + `@mysten/dapp-kit` dashboard (planned)

---

## Competitive positioning vs track examples

We are **not** building:
- Another max-APY aggregator (Magma-style)
- Full insurance with tranches
- Generic payment rail without DeFi composability

We **are** building:
- **Programmable money with embedded risk logic** — the track's core thesis applied to savings

---

## Track checklist (submission readiness)

- [ ] README explains financial use case in non-jargon language
- [ ] Move modules handle coin ownership correctly (no leaked coins)
- [ ] PTB flow documented with example transaction
- [ ] NAVI testnet integration or documented mock with migration path
- [ ] Demo video: problem → live pause → why Sui → roadmap
- [ ] One primary track selected: **DeFi & Payments**
