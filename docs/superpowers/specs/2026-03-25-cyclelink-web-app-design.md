# CycleLink Web App Design

**Date:** 2026-03-25
**Project:** CS5224 Group 2 — CycleLink Frontend
**Scope:** Web app for B2C landing, B2B landing, B2B login portal, Admin dashboard, Business/Sponsor dashboard

---

## Overview

A single React + Vite + TypeScript + React Router v6 + Tailwind CSS web application hosted in `web-app/` and deployed to AWS S3 + CloudFront. The app serves two audiences:

- **B2C:** Potential cyclists who may download the CycleLink mobile app
- **B2B:** Government agencies, sponsors, and institutional partners who want to buy data or sponsor route waypoints

All five pages live in one deployment. Auth is mock (no real backend) — follows the same pattern as the existing `mobile/src/services/authService.ts`.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| Vite | Latest (already installed) | Build tool |
| TypeScript | Latest (already installed) | Type safety |
| React Router v6 | Latest | Client-side routing |
| Tailwind CSS | v3 | Styling |

---

## Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | `LandingPage` | Public | B2C landing — for potential app users |
| `/business` | `BusinessLandingPage` | Public | B2B landing — for sponsors and institutional partners |
| `/login` | `LoginPage` | Public | B2B login portal — redirects to role-based dashboard |
| `/admin` | `AdminDashboard` | Protected (admin) | System overview + user management |
| `/dashboard` | `BusinessDashboard` | Protected (business) | Sponsorship management + data insights |

Unauthenticated access to `/admin` or `/dashboard` redirects to `/login`.

---

## File Structure

```
web-app/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                         # React entry point
    ├── index.css                        # Tailwind directives (@tailwind base/components/utilities)
    ├── App.tsx                          # Router setup + ProtectedRoute logic
    ├── assets/                          # Static images and icons
    ├── components/
    │   ├── Navbar.tsx                   # B2C navbar (green, links to /business)
    │   ├── BusinessNavbar.tsx           # B2B navbar (dark green, links to /)
    │   ├── Footer.tsx                   # Shared footer
    │   ├── StatCard.tsx                 # Reusable KPI card (label + value + accent)
    │   └── ProtectedRoute.tsx           # Wraps /admin and /dashboard; redirects if not authed
    ├── context/
    │   └── AuthContext.tsx              # Auth state (user, login, logout) via React Context + localStorage
    ├── pages/
    │   ├── LandingPage.tsx              # /
    │   ├── BusinessLandingPage.tsx      # /business
    │   ├── LoginPage.tsx                # /login
    │   ├── AdminDashboard.tsx           # /admin
    │   └── BusinessDashboard.tsx        # /dashboard
    └── services/
        └── authService.ts              # Mock auth — same shape as mobile/src/services/authService.ts
```

---

## Design System

**Colour palette (Tailwind config):**

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#16a34a` (green-600) | CTAs, nav backgrounds, stat accents |
| Primary Dark | `#14532d` (green-900) | Headings, sidebar backgrounds |
| Primary Light | `#f0fdf4` (green-50) | Page backgrounds, card fills |
| Accent Muted | `#bbf7d0` (green-200) | Icon backgrounds, hover states |
| Text Primary | `#0f172a` (slate-900) | Body headings |
| Text Secondary | `#64748b` (slate-500) | Subtitles, captions |
| Warning | `#f59e0b` (amber-400) | Inactive/pending status badges |

**Typography:** System font stack (Tailwind default). Headings bold/extrabold, body text regular.

---

## Page Designs

### 1. B2C Landing Page — `/`

**Navbar:** Logo (`🚲 CycleLink`) left, "For Business" text link + "Download App" pill button right. Green-600 background, white text.

**Hero section:** Split layout — left text block (headline, subtext, two app store buttons), right phone mockup placeholder. Green-50 to green-100 gradient background.
- Headline: *"Smarter cycling across Singapore."*
- Subtext: *"Personalised routes scored by shade, weather, difficulty & heritage."*

**Features section (3 cards):** White background.
- 🌿 Shade-Aware — Routes rated by tree coverage
- ⛅ Weather-Smart — Live NEA data baked in
- 🏮 Heritage Trails — Hawkers & historic sites

**How it works (3 steps):** Horizontal stepper with arrows.
1. Set your preferences → 2. Get your best route → 3. Ride & rate it

**Footer:** Links to `/business`, social placeholders, copyright.

---

### 2. B2B Landing Page — `/business`

**Navbar:** Logo + "CycleLink Business" left, "For Cyclists" text link + "Partner Login" button right. Green-900 background, white text.

**Hero section:** Dark green gradient background, white text.
- Headline: *"Reach Singapore's growing cycling community."*
- Subtext: *"Sponsor routes. Buy mobility data. Partner with CycleLink."*
- CTA: "Become a Partner →" button linking to `/login`

**Value propositions (3 rows):** Icon + title + description.
- 📍 Sponsored Waypoints — Feature your venue on recommended routes
- 📊 Mobility Analytics — Anonymised route demand & cyclist behaviour data
- 🏛️ Government Partnerships — Built for LTA, NParks, STB, HPB

**Platform stats bar:** Green-50 background. 3 numbers: 5,000+ Monthly Users · 50k Route Requests/mo · 8 Active Partners

**Footer:** Same as B2C footer.

---

### 3. B2B Login Portal — `/login`

Centred card on green-50 background.

**Card contents:**
- Logo + "Partner & Admin Portal" subtitle
- Email input
- Password input
- "Sign In" button (green-600)
- Demo credentials box (green-50 panel): `admin@cyclink.com` and `business@cyclink.com`, password: any

**Post-login routing:**
- `admin` role → `/admin`
- `business` role → `/dashboard`
- Any other role → `/` (fallback)

"← Back to cyclelink.com" link at bottom.

---

### 4. Admin Dashboard — `/admin`

**Layout:** Fixed sidebar (green-900) + scrollable main area (slate-50).

**Sidebar nav items:** Overview · Users · Routes · Reports · Settings. Overview is the active/default view. All other nav items are clickable but render a "Coming soon" placeholder instead of a real page. Logout button at bottom.

**Main area — Overview (default view):**

*KPI cards (2×2 grid):*
- Total Rides: 1,280
- Active Users: 452
- Revenue: $12.4k
- Open Reports: 12 (amber accent — indicates attention needed)

*User Management table:*

| Email | Role | Status | Joined |
|-------|------|--------|--------|
| alex@email.com | user | Active | Jan 2025 |
| jamie@email.com | user | Active | Feb 2025 |
| grace@email.com | user | Inactive | Feb 2025 |
| admin@cyclink.com | admin | Active | Jan 2025 |
| business@cyclink.com | business | Active | Jan 2025 |

Status badge: green pill for Active, amber pill for Inactive.

---

### 5. Business Dashboard — `/dashboard`

**Layout:** Fixed sidebar (green-800) + scrollable main area (slate-50).

**Sidebar nav items:** Overview · Sponsorships · Data Insights · Settings. Overview is the active/default view. All other nav items are clickable but render a "Coming soon" placeholder instead of a real page. Logout at bottom.

**Main area — Overview (default view):**

*KPI cards (2×2 grid):*
- Active Sponsors: 8
- Data Points: 45.2k
- Total Spent: $3,420
- User Reach: 8.5k users

*Sponsored Locations table:*

| Venue | Location | Views | Clicks | Status |
|-------|----------|-------|--------|--------|
| Maxwell Food Centre | Tanjong Pagar | 1,200 | 340 | Live |
| East Coast Park | Marine Parade | 980 | 210 | Pending |
| Chinatown Heritage Trail | Chinatown | 750 | 180 | Live |
| Bedok Interchange | Bedok | 620 | 145 | Pending |

Status badge: green for Live, amber for Pending.

---

## Auth Service (Mock)

`web-app/src/services/authService.ts` mirrors the mobile pattern:

```ts
// Mock credentials
// admin@cyclink.com  → role: 'admin'   → redirects to /admin
// business@cyclink.com → role: 'business' → redirects to /dashboard
// Any password accepted
```

`AuthContext.tsx` exposes `{ user, login, logout }`. Token + user stored in `localStorage` so state persists on refresh. `ProtectedRoute` reads context and redirects to `/login` if no user.

---

## Deployment

Build output: `web-app/dist/` → upload to S3 bucket → served via CloudFront. Single-page app requires S3 static website hosting with error document set to `index.html` so React Router handles all routes client-side.

---

## Out of Scope

- Real backend integration (backend team owns this)
- B2C user login / registration (handled by mobile app only)
- Actual charts/visualisations in dashboards (stat cards + tables only)
- Pricing page, contact form, terms & conditions
