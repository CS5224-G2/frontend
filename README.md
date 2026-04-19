# CycleLink Frontend

Frontend monorepo for **CycleLink** — an intelligent cycling route recommendation platform built for CS5224 Cloud Computing (Group 2). The project is complete and deployed.

## What was built

**Mobile app** (`mobile/`) — Expo (React Native) app for cyclists:

- Onboarding flow with cyclist type and preference selection
- Home screen with AI-powered route discovery and Mapbox map integration
- Route history tab with past rides
- Profile tab with account management, privacy/security settings, and password changes
- Auth flow: register, login, forgot/reset password
- Location tracking, push notifications, and SQLite-backed local storage
- Secure credential storage via Expo SecureStore
- Android APK distributed via S3 + direct download link on the landing page

**Web app** (`web-app/`) — React + Vite + TypeScript SPA deployed on AWS Amplify:

- `/` — B2C landing page (cyclists) with APK download
- `/business` — B2B landing page (sponsors, government agencies)
- `/login` — Partner & Admin login portal
- `/admin` — Admin dashboard (role-gated)
- `/dashboard` — Business dashboard (role-gated)
- `/forgot-password`, `/reset-password` — Password recovery flow

## Repo structure

```
frontend/
├── mobile/              # Expo (React Native) — main user-facing app
├── web-app/             # Vite SPA — landing page + admin/business dashboards
├── admin-dashboard/     # Legacy placeholder (not deployed)
└── docs/                # Design notes and API contracts
```

## Running locally

### Mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with your iPhone camera to open in Expo Go, or press **i** for iOS Simulator. See [docs/TEST_DEPLOY.md](docs/TEST_DEPLOY.md) for a full device setup guide.

Backend base URL is configured via `mobile/.env` (see `mobile/README.md`).

### Web app

```bash
cd web-app
npm install
npm run dev        # http://localhost:5173
```

Demo credentials (mock auth):

| Email | Password | Redirects to |
|-------|----------|-------------|
| `admin@cyclink.com` | any | `/admin` |
| `business@cyclink.com` | any | `/dashboard` |

Environment variables are in `web-app/.env.example`. Set `VITE_ANDROID_APK_URL` to expose the APK download on the landing page.

## Deployment

### Web app hosting

Hosted on AWS Amplify using `amplify.yml` at the repo root (`appRoot: web-app`).

Required Amplify environment variable: set `VITE_ANDROID_APK_URL` to the public S3 or CloudFront URL for the latest Android APK.

### Android APK

`.github/workflows/eas-build.yml` builds an APK via Expo EAS on every `mobile/**` change and uploads it to S3:

- `s3://$AWS_S3_BUCKET/android/latest.apk`
- `s3://$AWS_S3_BUCKET/android/${GITHUB_SHA}.apk`

Required GitHub Actions secrets/variables: `EXPO_TOKEN`, `AWS_ROLE_TO_ASSUME`, `AWS_REGION`, `AWS_S3_BUCKET`. Authentication uses GitHub OIDC — no long-lived AWS keys.

## Tests

```bash
cd web-app && npm test   # 15 Vitest unit tests
```

Covers: auth service, AuthContext (localStorage persistence), ProtectedRoute (role-based redirect).

CI runs automatically via `web-ci.yml` on every push or PR touching `web-app/`.

---

## AI Usage Declaration

This project used AI-assisted development tools as part of the CS5224 Cloud Computing group project.

**Tools used:** Claude Code (Anthropic Claude Sonnet 4.6) via the Claude Code CLI, Claude Opus 4.6 via Antigravity CLI, and OpenAI Codex 5.4 via Codex App.

**Scope of AI assistance:**
- Generating the `web-app/` frontend (React + Vite + TypeScript + Tailwind CSS) from a human-authored specification and implementation plan
- Generating the `mobile/` Expo app using AI-assisted coding
- Writing and reviewing unit tests (Vitest + React Testing Library)
- Identifying and fixing bugs (accessibility, redirect logic, TypeScript type errors)
- Code quality review (accessibility, React anti-patterns, security)

**Human contributions:**
- Project requirements, system design, and architecture decisions
- Review and approval of all design specifications and implementation plans
- Validation of final output against project goals
- Backend, infrastructure, and deployment configuration

All AI-generated code was reviewed and approved by the team before being committed.

## Learning
AI assistance delivered the most value on high-volume, pattern-repetitive work like generating Tailwind-styled UI components, form pages, and navigation scaffolding, but required the most human intervention at integration boundaries. The background ride tracking service (haversine geometry, checkpoint proximity thresholds, mid-ride token expiration carveouts) and the adapter layers translating between backend snake_case and frontend camelCase schemas consistently needed human correction to handle edge cases the AI glossed over. Core architectural decisions — choosing React Context over Redux, designing the mock/real API toggle, and structuring the dual web-and-mobile repo around shared types — remained irreducibly human, because they encoded tradeoffs specific to a time-boxed academic project with a separately owned backend that no prompt could fully specify in advance.
