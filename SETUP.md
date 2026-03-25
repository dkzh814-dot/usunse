# UsUnse — Setup Guide

## 1. Install dependencies

```bash
cd usunse
npm install
```

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com) → New project
2. Add a Web app → copy the config values
3. Enable Firestore Database (start in test mode)

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys
2. Copy publishable + secret keys
3. Create 4 products in Stripe:
   - **Five Elements Analysis** — one-time $1.00
   - **Detailed Compatibility** — one-time $1.00
   - **Full Saju Life Reading** — one-time $9.00
   - **Monthly Fortune** — recurring $5.00/month
4. Copy each Price ID into the env vars

### Stripe Webhook (local dev)
```bash
stripe listen --forward-to localhost:3000/api/webhook
# copy the webhook secret → STRIPE_WEBHOOK_SECRET
```

### Anthropic
Get your API key from [console.anthropic.com](https://console.anthropic.com)

## 3. Run locally

```bash
npm run dev
# → http://localhost:3000
```

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all env vars in Vercel dashboard → Settings → Environment Variables.

For the Stripe webhook in production:
- Vercel URL: `https://usunse.com/api/webhook`
- Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`

## Project structure

```
src/
  app/
    page.tsx              ← Landing page
    result/page.tsx       ← Free result + email gate
    paid/
      fiveElements/       ← $1 Five Elements (Claude streaming)
      compatibility/      ← $1 Compatibility checker
      fullReading/        ← $9 Full life reading (Claude streaming)
      monthly/            ← $5/mo Monthly fortune
    api/
      checkout/           ← Stripe checkout session creation
      webhook/            ← Stripe webhook handler
      analyze/            ← Claude API streaming endpoint
  components/
    Logo.tsx              ← Stacked US/운세 logo
    BirthForm.tsx         ← Landing page input form
    EmailGate.tsx         ← Modal email capture
    ScoreRing.tsx         ← Animated SVG compatibility ring
    FourPillarsDisplay.tsx ← Chinese characters pillar grid
    StreamingAnalysis.tsx  ← Claude streaming text renderer
    TierCards.tsx         ← Paid tier upsell cards
  lib/
    saju.ts               ← Four Pillars calculation engine
    idols.ts              ← Idol database + matching logic
    firebase.ts           ← Firestore client
    stripe.ts             ← Stripe client + product config
```

## Hard rules enforced

- Free result: never shows element names (Wood/Fire/Earth/Metal/Water)
- $1 tiers: never show 10-year luck cycles or monthly forecasts
- $9 reading: never shows monthly breakdown
- Saju Four Pillars shown in Chinese characters only
```
