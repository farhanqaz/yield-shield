# Deploy via GitHub + Vercel

Hackathon submission membutuhkan **repo GitHub public** + **live demo URL**.

## 1. Push ke GitHub

```bash
cd ~/sui_hackathon

# Sudah di-init oleh setup — kalau belum:
git init
git add .
git commit -m "Yield Shield — programmable DeFi safety rail for Sui Overflow"

# Buat repo public di GitHub (ganti USERNAME)
gh repo create yield-shield --public --source=. --remote=origin --push
```

Atau manual: buat repo di github.com → `git remote add origin ...` → `git push -u origin main`

## 2. Connect Vercel ke GitHub

1. Buka [vercel.com/new](https://vercel.com/new)
2. **Import** repo `yield-shield` dari GitHub
3. **Root Directory:** `app` ← penting!
4. Framework: Next.js (auto-detect)
5. **Environment Variables** — tambahkan:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_PACKAGE_ID` | dari `app/.env.local` |
| `NEXT_PUBLIC_VAULT_ID` | dari `app/.env.local` |
| `NEXT_PUBLIC_ADMIN_CAP_ID` | dari `app/.env.local` |
| `NEXT_PUBLIC_COIN_TYPE` | `0x2::sui::SUI` |
| `NEXT_PUBLIC_PYTH_SUI_FEED_ID` | dari `.env.local.example` |

6. **Deploy** → copy URL ke `docs/PITCH_DECK.md` slide 3

## 3. Auto-deploy

Setiap `git push` ke `main` → Vercel redeploy otomatis.

## 4. Submission Overflow

- GitHub repo URL (public)
- Live demo URL (Vercel)
- Demo video link
- Track: **DeFi & Payments**

Lihat juga: [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md)
