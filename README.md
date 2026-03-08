# Restinder 🍽️

A Tinder-style app for couples and groups to settle the eternal question: **"Where should we eat?"** Swipe through restaurants together, find matches, and order delivery — all in one place.

## Features

### Core

- **Swipe-to-match** — Framer Motion drag gestures with like/nope indicators
- **Local & Remote modes** — Same-phone handoff or real-time Supabase multiplayer
- **Super Veto** — 3 power vetoes per player to instantly kill a pick
- **Tiebreaker round** — Re-vote on top picks when nobody agrees
- **DoorDash delivery** — Order directly from match results via Drive API

### Filters

- **12 cuisine types** with multi-select
- **6 category tabs** (Popular, Trending, Hidden Gems, Quick Bites, Top Rated, Date Night)
- **7 dietary restrictions** (Vegetarian, Vegan, GF, Halal, Kosher, Nut-Free, Pescatarian)
- **7 occasion tags** (Date Night, Quick Lunch, Family, Brunch, Late Night, Special Occasion, Dinner)
- **Price range** ($–$$$$), **distance slider** (0.5–10 mi), **rating floor**, **Open Now** toggle

### UX Polish

- **Dark glassmorphism theme** with gradient accents
- **Animated onboarding tutorial** (4-slide walkthrough for first-time users)
- **Sound effects** via Web Audio API (whoosh, ding, fanfare, buzz — no audio files)
- **Haptic feedback** on swipe, veto, and match
- **Enhanced match celebration** — 30-particle confetti burst with pulsing glow
- **Restaurant detail view** — Slide-up panel with hours, dietary badges, reviews, Google Maps link
- **Share results** — Native Share API with clipboard fallback
- **Favorites panel** — Save, mark visited, persistent via localStorage
- **PWA install banner** — Custom animated prompt
- **Timer mode** — Configurable per-card countdown

## Tech Stack

| Layer           | Tool                                 |
| --------------- | ------------------------------------ |
| Framework       | React 18 + Vite                      |
| Animations      | Framer Motion                        |
| Styling         | Tailwind CSS (dark theme)            |
| Icons           | Lucide React                         |
| Realtime / Auth | Supabase (Postgres, Realtime)        |
| Delivery        | DoorDash Drive API (Express backend) |
| PWA             | vite-plugin-pwa                      |

## Getting Started

```bash
# Clone
git clone https://github.com/jcronkdc/restinder.git
cd restinder

# Install & run frontend
npm install
npm run dev          # → http://localhost:3000

# (Optional) Run delivery backend
cd server
cp .env.example .env   # Add your DoorDash credentials
npm install
npm run dev             # → http://localhost:3001
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── App.jsx                    # Main component (swiping, filters, results, overlays)
├── components/
│   └── DeliveryOrder.jsx      # DoorDash delivery flow (form → quote → tracking)
├── data/
│   └── restaurants.js         # 24 restaurants + CUISINES, CATEGORIES, DIETARY, OCCASIONS
├── lib/
│   └── supabase.js            # Supabase client, device ID, partner code generation
├── main.jsx                   # Entry point
└── index.css                  # Tailwind directives + glass/gradient utilities

server/
├── index.js                   # Express API (quotes, deliveries, webhooks, SSE)
├── doordash-api.js            # DoorDash Drive v2 HTTP client
├── doordash-jwt.js            # JWT generation for DoorDash auth
└── .env.example               # Credential template
```

## License

MIT

---

Made with ❤️ for food lovers everywhere!
