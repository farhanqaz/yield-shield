# Yield Shield — MVP Technical Spec

## Scope (solo sprint, 6 weeks)

### In scope (v1)
1. USDC vault on Sui testnet
2. ShieldScore (0–100) from 3 on-chain / oracle signals
3. Circuit breaker: pause deposits when score < 30
4. Deposit / withdraw with share accounting
5. NAVI supply adapter (testnet; mock fallback for local dev)
6. Dashboard: status badge + score + APY estimate

### Out of scope (v1)
- Multi-asset vaults
- Scallop + NAVI dual routing
- Auto-deleverage for loopers
- Full parametric insurance
- Tokenomics / governance

---

## Architecture

```
┌─────────────┐     PTB (atomic)      ┌──────────────────────────────────┐
│   Frontend  │ ────────────────────► │ deposit → supply_navi → score   │
│  dApp Kit   │                       │ withdraw → navi_withdraw → coin   │
└─────────────┘                       └──────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              ┌──────────┐            ┌─────────────┐           ┌──────────┐
              │  vault   │◄──────────►│ navi_adapter│           │shield_score│
              │ (shared) │            │  (module)   │           │  (pure)   │
              └──────────┘            └─────────────┘           └──────────┘
```

---

## ShieldScore formula (v1)

Deterministic, on-chain, no ML — judges can audit rules in Move.

| Signal | Source | Weight | Normalization |
|--------|--------|--------|---------------|
| Pool utilization | NAVI market object / admin update | 40% | `100 - utilization_bps/100` capped 0–100 |
| Price volatility | Pyth feed (SUI/USDC) 24h change bps | 35% | `100 - min(vol_bps/50, 100)` |
| Vault health margin | Internal buffer vs total shares | 25% | `min(buffer_ratio * 100, 100)` |

```text
score = (util_component * 40 + vol_component * 35 + health_component * 25) / 100
```

### Status thresholds

| Score | Status | Deposits | Withdrawals |
|-------|--------|----------|-------------|
| ≥ 60 | **Safe** | ✅ | ✅ |
| 30–59 | **Caution** | ✅ (with warning in UI) | ✅ |
| < 30 | **Paused** | ❌ | ✅ always |

---

## Move modules

| Module | Responsibility |
|--------|----------------|
| `yield_shield::vault` | Shared `Vault`, deposit/withdraw, pause flag |
| `yield_shield::shield_score` | Pure score math + status enum |
| `yield_shield::navi_adapter` | Supply/withdraw wrappers (NAVI or mock) |
| `yield_shield::receipt` | `ShieldReceipt` object — user's share proof |
| `yield_shield::admin` | One-time init, metric updates (oracle keeper) |

---

## Key objects

### `Vault` (shared)
```move
public struct Vault<phantom T> has key {
    id: UID,
    total_shares: u64,
    reserve: Balance<T>,      // idle + pending
    supplied: u64,            // amount tracked at NAVI
    score: u8,
    status: u8,               // 0=Safe, 1=Caution, 2=Paused
    utilization_bps: u64,
    volatility_bps: u64,
    paused: bool,
}
```

### `ShieldReceipt<phantom T>` (owned)
```move
public struct ShieldReceipt<phantom T> has key, store {
    id: UID,
    vault_id: ID,
    shares: u64,
}
```

---

## PTB flows

### Deposit (happy path)
1. Split USDC coin from user
2. `vault::deposit(vault, coin, ctx)` — mint shares, update receipt
3. `navi_adapter::supply(vault, amount)` — move funds to NAVI
4. `vault::refresh_score(vault, oracle_args)` — update score/status

### Withdraw (always allowed)
1. `navi_adapter::withdraw(vault, amount)` — pull from NAVI if needed
2. `vault::withdraw(vault, receipt, amount, ctx)` — burn shares, return coin

### Demo stress trigger (testnet)
Admin/keeper calls `vault::set_stress_metrics(vault, high_util, high_vol)` → score drops → `paused = true`.

---

## Frontend screens (v1)

1. **Connect** — zkLogin or Sui Wallet
2. **Dashboard** — ShieldScore gauge, status badge, estimated APY
3. **Deposit / Withdraw** — amount input, tx status
4. **Activity** — last score updates (optional v1.1)

---

## Integration targets (testnet)

| Protocol | Purpose | Priority |
|----------|---------|----------|
| NAVI Protocol | USDC supply yield | P0 |
| Pyth | SUI/USDC volatility | P1 |
| zkLogin | Retail onboarding | P1 |

Package IDs: fill after testnet deploy in `app/src/config.ts`.

---

## Demo script (5 min)

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

---

## Success metrics (hackathon)

| Metric | Target |
|--------|--------|
| End-to-end tx on testnet | ≥ 3 flows recorded on video |
| Move test coverage | Core vault + score unit tests |
| README | Architecture + deploy steps |
| Track fit | Explicit "programmable money" narrative |
