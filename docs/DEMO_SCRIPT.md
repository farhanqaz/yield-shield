# Yield Shield — Demo Video Script (~5 min)

**Track:** DeFi & Payments · **Goal:** Top 2 rubric (50% real-world)

---

## 0:00–0:50 — Problem (Real-World)

> "On Sui, DeFi users face a real problem: when volatility spikes, getting out means juggling multiple transactions — slow and stressful. After recent ecosystem stress, many retail users just hold idle assets instead of earning safely."

**Visual:** Headline on screen — *"Manual DeFi exits are broken"*

---

## 0:50–1:20 — Solution

> "Yield Shield is a programmable safety rail. You deposit SUI into a guarded vault. ShieldScore monitors risk — powered by Pyth price signals. When risk is too high, deposits pause automatically. And if you need out — one button: **Emergency Exit** — your funds return in a single atomic PTB on Sui."

---

## 1:20–3:30 — Live demo (testnet)

1. Open live app (Vercel URL)
2. Connect wallet · show **ShieldScore gauge** + Pyth SUI/USD price
3. Deposit 0.1 SUI → score stays **Safe**
4. Open demo controls → **Sync from Pyth** or **Stress → pause**
5. Status flips **Paused** · deposits disabled
6. Hit **Emergency Exit — withdraw all (PTB)** · confirm in wallet
7. Show [Sui Explorer](https://suiscan.xyz/testnet) transaction digest

**Say:** "One PTB — no manual orchestration. That's programmable money on Sui."

---

## 3:30–4:10 — Technical (20%)

> "Three reasons this is native to Sui:
> 1. **Objects** — vault and receipt are first-class assets
> 2. **PTBs** — deposit and exit bundle multiple Move calls atomically
> 3. **Pyth** — real oracle feed drives on-chain ShieldScore via keeper transaction"

**Visual:** architecture diagram from README

---

## 4:10–5:00 — Vision + close

> "v1 is the seatbelt for yield. v2 adds NAVI position reads. v3 extends the same PTB pattern to full deleverage — withdraw, swap, repay — without users clicking three times."

> "Built during Mancer × Superteam bootcamp. Yield Shield — programmable DeFi safety for Sui."

---

## Pre-record checklist

- [ ] Wallet funded testnet SUI
- [ ] Admin wallet for demo stress (or Pyth sync)
- [ ] Vercel URL works on mobile
- [ ] Explorer tab pre-opened
- [ ] Hide browser extensions / notifications
- [ ] Rehearse 3× — pick best take
