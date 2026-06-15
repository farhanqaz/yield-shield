# Yield Shield — Demo Video Script (~5 min)

**Track:** DeFi & Payments · **Target:** Top 3

---

## 0:00–0:40 — Problem

> "The DeFi and Payments track asks a simple question: why are payments still static transfers while DeFi lives in a separate, manual world? On Sui, that changes — payments can become programmable financial actions. Yield Shield shows how."

**Visual:** Track problem statement headline on screen

---

## 0:40–1:10 — Solution

> "Yield Shield turns an incoming payment into a guarded savings flow in one atomic PTB. Smart Save auto-splits funds between a shielded vault and a liquid buffer. ShieldScore monitors risk from Pyth. When risk is too high, deposits pause. Emergency Exit returns your vault position in a single transaction."

---

## 1:10–2:30 — Smart Save (hero demo)

1. Open **`/save?amount=0.5`** (programmable payment link)
2. Connect wallet · show suggested amount
3. Click **Smart Save** — explain split ratio on screen
4. Confirm wallet · show explorer digest
5. **Say:** "One PTB — split, deposit, guard. No manual orchestration."

---

## 2:30–3:30 — Risk + Emergency Exit

1. Dashboard · **ShieldScore gauge** + Pyth price
2. Demo controls → **Sync from Pyth** or **Stress → pause**
3. Status **Paused** · deposits disabled
4. **Emergency Exit** → confirm · explorer tx
5. **Say:** "Programmable exit — one signature, atomic on Sui."

---

## 3:30–4:10 — Technical

> "Three Sui primitives:
> 1. **Objects** — vault and receipt are first-class assets
> 2. **PTBs** — Smart Save and Emergency Exit bundle multiple Move calls
> 3. **Composability** — Pyth keeper + optional NAVI lending in the same transaction pattern"

**Visual:** architecture from README

---

## 4:10–5:00 — Close

> "Yield Shield — programmable money with guardrails. Testnet live today. Mainnet path adds NAVI composable earn. GitHub and live demo in the submission."

---

## Pre-record checklist

- [ ] Wallet funded (testnet SUI)
- [ ] Admin wallet for stress / Pyth sync
- [ ] Vercel URL + `/save?amount=0.5` works
- [ ] Explorer tab ready
- [ ] Rehearse 3×
