# sui-pilot Setup (Hackathon)

Official hackathon recommendation: [contract-hero/sui-pilot](https://github.com/contract-hero/sui-pilot)

Already vendored in this repo at **`.cursor/sui-pilot/`** (753 doc files + 5 skills).

## Cursor (this IDE)

The project skill **`.cursor/skills/sui-pilot/SKILL.md`** teaches the agent to:

1. Read bundled docs before writing Move / dapp-kit code
2. Run `move-code-quality` and `move-code-review` checklists
3. Route DeFi questions to `.sui-docs/` and frontend to `.ts-sdk-docs/`

**Usage in chat:** mention "use sui-pilot" or ask any Sui/Move question — the skill auto-applies.

## Claude Code (full plugin)

For LSP diagnostics + sui-prover MCP:

```
/plugin marketplace add contract-hero/plugin-marketplace
/plugin install sui-pilot@contract-hero
```

Restart Claude Code. Requires `suiup install sui` + `move-analyzer` (matching versions).

## Prerequisites

```bash
curl -fsSL https://sui.io/install.sh | sh   # suiup
suiup install sui
suiup install move-analyzer
```

## Verify

```bash
cd move/yield_shield
sui move test
```

## Update bundled docs

```bash
cd .cursor/sui-pilot && ./sync-docs.sh
```

## Links

- Landing: https://contract-hero.github.io/sui-pilot/
- For dummies: `.cursor/sui-pilot/SUI_PILOT_FOR_DUMMIES.md`
