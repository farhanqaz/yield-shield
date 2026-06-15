---
name: sui-pilot
description: >-
  Doc-first Sui/Move development using contract-hero/sui-pilot bundled docs
  (753 files). Use when writing Move contracts, Sui PTBs, dapp-kit frontend,
  Walrus/Seal integration, NAVI/DeFi composability, move-code-quality review,
  or Sui Overflow hackathon work on this repo.
---

# sui-pilot (Cursor)

Ground all Sui/Move/TS SDK answers in **local bundled docs** — training data is stale.

**Repo (cloned):** `.cursor/sui-pilot/` — [contract-hero/sui-pilot](https://github.com/contract-hero/sui-pilot)

**Agent directive:** Read `.cursor/sui-pilot/agents/sui-pilot-agent.md` at session start for full ecosystem map.

## Doc-first rule

Before writing or reviewing Sui/Move/TS code:

1. `Grep` / `Glob` under `.cursor/sui-pilot/.<corpus>-docs/`
2. Prefer bundled docs over memory
3. If inconclusive, say so explicitly

| Topic | Search root |
|-------|-------------|
| Move syntax, abilities, idioms | `.cursor/sui-pilot/.move-book-docs/` |
| Objects, PTBs, DeFi, framework | `.cursor/sui-pilot/.sui-docs/` |
| dapp-kit, TS SDK, payments | `.cursor/sui-pilot/.ts-sdk-docs/` |
| Walrus storage | `.cursor/sui-pilot/.walrus-docs/` |
| Seal encryption | `.cursor/sui-pilot/.seal-docs/` |
| Formal verification | `.cursor/sui-pilot/.sui-prover-docs/` |

## Bundled procedural skills

Read these from `.cursor/sui-pilot/skills/` when triggered:

| Skill | When |
|-------|------|
| `move-code-quality/SKILL.md` | After editing `.move` files — Move 2024 checklist |
| `move-code-review/SKILL.md` | Before submission — security/architecture (40 checks) |
| `oz-math/SKILL.md` | DeFi math (ShieldScore, shares, bps) |
| `specify/SKILL.md` | Optional `#[spec(prove)]` for public functions |
| `verify/SKILL.md` | Re-run prover after changes |

## Workflow (this project)

```
1. Grep docs for pattern (e.g. "shared object", "programmable transaction")
2. Implement in move/yield_shield/ or app/
3. sui move test   (in move/yield_shield/)
4. Read move-code-quality skill → fix issues
5. Read move-code-review skill → if substantial change
```

## Yield Shield doc hints

For this hackathon project, grep these topics first:

- **Shared vault:** `.sui-docs/` → `share_object`, dynamic fields
- **PTB deposit flow:** `.sui-docs/` → programmable transaction blocks
- **dapp-kit:** `.ts-sdk-docs/` → dapp-kit, `useSignAndExecuteTransaction`
- **On-chain finance / lending:** `.sui-docs/` → onchain-finance
- **Payment-kit (optional v2):** `.ts-sdk-docs/` → payment-kit

## Move 2024 quick checks

- `edition = "2024.beta"` or `"2024"` in Move.toml
- `module pkg::mod;` not curly-brace modules
- `ctx.sender()`, `coin.into_balance()`, `id.delete()`
- Prefer `public fun` returning values over `public entry` (PTB composability)
- Error constants: `EPascalCase`; events: past tense

## Tooling (optional)

If `sui` + `move-analyzer` installed via [suiup](https://github.com/MystenLabs/suiup):

```bash
suiup install sui && suiup install move-analyzer
cd move/yield_shield && sui move test
```

Claude Code users can also install the full plugin (MCP LSP + prover):

```
/plugin marketplace add contract-hero/plugin-marketplace
/plugin install sui-pilot@contract-hero
```

## Refresh docs

```bash
cd .cursor/sui-pilot && ./sync-docs.sh
```
