# Submission Checklist — Sui Overflow DeFi Track

Target: **Top 2 DeFi & Payments**

---

## Before submit

### Real-World (50%)
- [ ] 5 problem interviews done — paste quotes in `PITCH_DECK.md` slide 1
- [ ] Persona clear: bootcamp builder / retail DeFi first-timer
- [ ] Problem = manual exit + fear, NOT generic "DeFi is hard"

### Product & UX (20%)
- [ ] Vercel live URL in README + pitch deck slide 3
- [ ] Emergency Exit button tested on testnet
- [ ] Mobile layout OK
- [ ] No "Contract not configured" on production

### Technical (20%)
- [ ] Package + Vault on testnet (see README)
- [ ] 2+ explorer tx links in demo video description
- [ ] Pyth price visible in app
- [ ] `sui move test` passes

### Presentation (10%)
- [ ] Demo video ≤ 5 min (`docs/DEMO_SCRIPT.md`)
- [ ] Pitch deck exported PDF or link to `PITCH_DECK.md`
- [ ] GitHub repo public, README complete

### Community
- [ ] Post in Superteam Indonesia Discord with Vercel link
- [ ] Tag #SuiOverflow / bootcamp cohort

---

## Demo video shot list (minimum)

1. Problem voiceover (15s)
2. Deposit → Safe gauge
3. Stress OR Pyth sync → Paused
4. Emergency Exit → explorer tx
5. Why Sui PTB (15s)
6. Roadmap (15s)

---

## Env vars for Vercel

Copy from `app/.env.local`:

```
NEXT_PUBLIC_PACKAGE_ID=
NEXT_PUBLIC_VAULT_ID=
NEXT_PUBLIC_ADMIN_CAP_ID=
NEXT_PUBLIC_COIN_TYPE=0x2::sui::SUI
NEXT_PUBLIC_PYTH_SUI_FEED_ID=0xef0d8b6fda2ce01b21879bd86caea3e1dbd8ec4bfdaf0a2e3b1e3bbf1ebfc2c1
```

---

## Admin wallet for demo

Stress / Pyth sync requires **AdminCap** on connected wallet.

Deployer: `musing-epidote` (`0xe870454b…4bfb`) — import to Sui Wallet for demo day.

---

## Deploy Vercel (manual)

```bash
cd app
npx vercel login
npx vercel --prod
# Set root to app/ if importing from GitHub UI instead
```
