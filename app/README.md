# Yield Shield — Next.js Frontend

Next.js 15 (App Router) + `@mysten/dapp-kit` + Tailwind CSS v4.

## Why Next.js for hackathon

- One-command deploy to **Vercel** (live URL for judges)
- App Router + client components for wallet hooks
- Familiar stack if you already know React

## Run locally

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

```bash
npm run build
# or connect repo to vercel.com — root directory: app/
```

## Structure

```
src/
  app/           layout, page, globals
  components/    providers, dashboard, status-badge
  lib/config.ts  package ID, vault ID after deploy
```

## Next steps

1. Fill `src/lib/config.ts` after `sui client publish`
2. Wire `useSuiClient` to read vault `score` / `status`
3. Build deposit/withdraw PTBs with `useSignAndExecuteTransaction`
