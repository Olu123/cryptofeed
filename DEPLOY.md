# 🚀 CryptoFeed — Deploy Guide

**Zero cost to launch. Live in under 30 minutes.**

---

## Prerequisites
- GitHub account (free)
- Vercel account (free) → vercel.com
- Supabase account (free) → supabase.com
- Stripe account (free to set up) → stripe.com

---

## Step 1 — Push to GitHub

```bash
cd cryptofeed
git init
git add .
git commit -m "Initial CryptoFeed commit"
gh repo create cryptofeed --public --push
```

---

## Step 2 — Supabase Setup (10 min)

1. Go to **supabase.com** → New Project
2. Name it `cryptofeed`, choose nearest region
3. Save your database password somewhere safe
4. Go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → Run
5. Go to **Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

6. **Enable OAuth providers** (Settings → Authentication → Providers):
   - Google: Create OAuth app at console.cloud.google.com
   - Twitter/X: Create app at developer.twitter.com

---

## Step 3 — Deploy to Vercel (5 min)

1. Go to **vercel.com** → Add New Project → Import your GitHub repo
2. Add environment variables (from `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
AGGREGATE_SECRET=any-random-secret-string-here
```

3. Click **Deploy** → Done!

---

## Step 4 — Stripe Setup (5 min)

1. Go to **dashboard.stripe.com** → Products → Create product:
   - Name: `CryptoFeed Pro`
   - Price: `$7.00/month`
   - Copy the **Price ID** → `STRIPE_PRO_PRICE_ID`
2. Go to **Webhooks** → Add endpoint:
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Activate RSS Aggregator (2 min)

In your GitHub repo → **Settings → Secrets and variables → Actions** → New secret:

- `AGGREGATE_SECRET` = same value as in Vercel env vars
- `APP_URL` = `https://your-domain.vercel.app`

The GitHub Action in `.github/workflows/aggregate.yml` will run **every 15 minutes**, pulling from all 30+ RSS feeds automatically.

To trigger manually:
```
Actions tab → RSS Aggregator → Run workflow
```

Or run locally:
```bash
npm install
npm run aggregate
```

---

## Step 6 — Make Yourself Admin

In Supabase **SQL Editor**:
```sql
UPDATE profiles SET role = 'admin' WHERE username = 'your-username';
```

Then go to `/admin` to access the moderation panel.

---

## Step 7 — Start Earning in Month 1 💰

### A) Crypto Ad Networks (Day 1 — no traffic minimum)

**Coinzilla** (highest quality):
1. Go to coinzilla.com → Publisher signup
2. Add your domain → Get approved (usually < 24h)
3. Copy the ad code snippet → paste into `app/layout.tsx` replacing the `[ Ad slot ]` div

**A-ADS** (instant, no KYC):
1. Go to a-ads.com → Create ad unit
2. Paste the iframe code

**Bitmedia**:
1. bitmedia.io → Publisher → Register → Get script

→ Replace the `[ Ad slot — Coinzilla / A-ADS ]` div in `app/page.tsx` with the actual ad code.

### B) Sponsored Stories (Week 1)

Reach out to crypto projects directly:
- Email: `advertise@your-domain.com`
- Rate card: `$50–$200 per pinned story` (you pin via admin panel)
- Target: crypto projects launching, protocols wanting coverage

Channels to find clients:
- Twitter/X DMs to crypto projects
- Bluesky crypto community
- Telegram crypto groups
- CryptoTwitter announcements

### C) Newsletter (Week 1 — free via Beehiiv)

1. Sign up at **beehiiv.com** (free up to 2,500 subs)
2. Set up your daily digest template
3. Add newsletter signup to homepage sidebar
4. Monetize with sponsored slots once you hit 500 subs (~$50–$200/send)

### D) Pro Memberships (Week 2, after Stripe setup)

Go live at `/pro` — the Stripe checkout is already wired up.

---

## Step 8 — Social Setup

Register these handles **immediately** (don't wait for traffic):

- **X/Twitter**: @cryptofeedapp (or your brand name)
- **Bluesky**: cryptofeed.bsky.social
- **Telegram**: t.me/cryptofeed (announcement channel)

Update `app/layout.tsx` with your actual handles.

---

## Custom Domain (Free via Vercel)

1. Vercel Dashboard → your project → Settings → Domains
2. Add your domain (e.g., `cryptofeed.xyz` — available on Namecheap for ~$1)
3. Point DNS to Vercel's nameservers

---

## Month-1 Revenue Target

| Source | Conservative | Optimistic |
|---|---|---|
| Coinzilla/A-ADS | $30 | $150 |
| Sponsored story | $50 | $300 |
| Pro memberships (5-15 users) | $35 | $105 |
| Newsletter sponsor slot | $0 | $100 |
| **Total** | **~$115** | **~$655** |

---

## Architecture Overview

```
User → Vercel Edge (Next.js 14)
         ↓
      Supabase (Postgres + Auth + RLS)
         ↓
GitHub Actions Cron (every 15 min)
  → Pulls 30+ RSS feeds
  → Deduplicates by URL
  → Auto-categorizes
  → Inserts as approved stories
```

## File Structure

```
cryptofeed/
├── app/                    Next.js App Router pages
│   ├── page.tsx            Main feed (Hot/New/Top + filters)
│   ├── submit/             Story submission
│   ├── story/[id]/         Story detail + comments + predictions
│   ├── narratives/         Narrative thread browser
│   ├── narratives/[slug]/  Individual narrative timeline
│   ├── graveyard/          Misinformation archive
│   ├── predictions/        Community forecasting
│   ├── regulation/         Global regulation radar
│   ├── admin/              Moderation panel (mod/admin only)
│   ├── profile/[username]/ User profiles with social handles
│   ├── pro/                Pricing / upgrade page
│   ├── auth/               Login, signup, OAuth callback
│   └── api/                API routes (stories, votes, comments, stripe, rss, aggregate)
├── components/             Reusable UI components
├── lib/                    Supabase clients, types, scoring engine, utils
├── supabase/schema.sql     Complete database schema with RLS + triggers
├── scripts/aggregate-rss.ts  Standalone RSS aggregator
└── .github/workflows/      GitHub Actions cron job
```

---

## What Makes This Different

| Feature | CoinDesk | CryptoPanic | Reddit | **CryptoFeed** |
|---|---|---|---|---|
| Credibility scoring | ✗ | ✗ | ✗ | ✅ |
| Misinformation archive | ✗ | ✗ | ✗ | ✅ |
| Narrative threading | ✗ | ✗ | ✗ | ✅ |
| Non-English sources | ✗ | ✗ | ✗ | ✅ |
| Skin-in-game disclosure | ✗ | ✗ | ✗ | ✅ |
| Community predictions | ✗ | ✗ | partial | ✅ |
| Regulation global map | ✗ | ✗ | ✗ | ✅ |
| Social handles (X + Bluesky) | — | — | — | ✅ |
| Free to launch | — | — | — | ✅ |

---

## Support

Built with Next.js 14 · Supabase · Tailwind CSS · Stripe  
Zero infrastructure cost on free tiers.

Connect on X: [@cryptofeedapp](https://x.com/cryptofeedapp)  
Connect on Bluesky: [cryptofeed.bsky.social](https://bsky.app/profile/cryptofeed.bsky.social)
