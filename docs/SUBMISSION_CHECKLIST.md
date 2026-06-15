# Submission Checklist — Sui Overflow DeFi Track

Target: **Top 3** · stretch #1  
Submit via [DeepSurge](https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf)

---

## Before submit

### Problem & product
- [ ] README explains programmable payment → save flow (non-jargon)
- [ ] `/save?amount=0.5` works on production
- [ ] Smart Save PTB tested on testnet
- [ ] Emergency Exit tested when Paused

### UX
- [ ] Vercel live URL in README + pitch deck slide 3
- [ ] Mobile layout OK
- [ ] No "Contract not configured" on production

### Technical
- [ ] Package + Vault on testnet (see README)
- [ ] 2+ explorer tx links in demo video description
- [ ] Pyth price visible in app
- [ ] `sui move test` passes
- [ ] (Optional) Mainnet + `NEXT_PUBLIC_ENABLE_NAVI=true` for NAVI composable PTB

### Presentation
- [ ] Demo video ≤ 5 min (`docs/DEMO_SCRIPT.md`)
- [ ] Pitch deck PDF or link to `docs/PITCH_DECK.md`
- [ ] GitHub public: https://github.com/farhanqaz/yield-shield

---

## Demo video minimum shots

1. Problem voiceover (programmable money)
2. `/save` → Smart Save PTB → explorer
3. Stress/Pyth → Paused
4. Emergency Exit → explorer
5. Why Sui PTB (15s)

---

## Env vars for Vercel

```
NEXT_PUBLIC_PACKAGE_ID=
NEXT_PUBLIC_VAULT_ID=
NEXT_PUBLIC_ADMIN_CAP_ID=
NEXT_PUBLIC_COIN_TYPE=0x2::sui::SUI
NEXT_PUBLIC_PYTH_SUI_FEED_ID=0xef0d8b6fda2ce01b21879bd86caea3e1dbd8ec4bfdaf0a2e3b1e3bbf1ebfc2c1
NEXT_PUBLIC_SMART_SAVE_VAULT_BPS=8500
NEXT_PUBLIC_ENABLE_NAVI=false
NEXT_PUBLIC_SUI_NETWORK=testnet
```

---

## Admin wallet for demo

Stress / Pyth sync requires **AdminCap** on connected wallet (deployer address in README).
