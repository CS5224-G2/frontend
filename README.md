# CycleLink Frontend

Frontend repository for **CycleLink** — intelligent cycling route recommendations (CS5224 Group Project). This monorepo contains the Amplify-hosted web app and the Expo mobile app.

## Design summary (from Prelim Report)

- **Mobile app:** Expo (React Native). User flow: onboarding (cyclist type + preferences) → home (discover/customise routes) → export route to **Google Maps / Apple Maps** via deep link → post-ride return to app for checkpoint feedback and **route rating**.
- **Navigation:** We recommend the route; turn-by-turn navigation runs in the external map app (Approach B).
- **Web app:** Vite frontend for the public landing page and admin/business dashboards; hosted on AWS Amplify from `web-app/`.
- **Android distribution:** Expo EAS builds an Android APK, and GitHub Actions uploads it to S3 for direct download.


## Repo structure

```
frontend/
├── mobile/              # Expo (React Native) — main user-facing app
├── web-app/             # Vite SPA — landing page + admin/business dashboards
├── admin-dashboard/     # Legacy placeholder app (not used for deployment)
└── docs/                # Design notes and contracts
```

## Getting started

### Mobile app (with CycleLink icon)

The app icon is set from `design/Icon.png` (copied to `mobile/assets/icon.png`). To run and test on your **iPhone**:

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with your iPhone camera and open in **Expo Go**, or press **i** for iOS Simulator. For a full step-by-step (including optional standalone build for device), see **[docs/TEST_DEPLOY.md](docs/TEST_DEPLOY.md)**.

Implement screens and services under `mobile/src/` as needed. Backend base URL and env are configured via `.env` (see `mobile/README.md`).

### Web app

The live website is `web-app/`, a React + Vite + TypeScript SPA deployed with AWS Amplify. The `admin-dashboard/` folder is a legacy placeholder and is not part of the current hosting flow.

## Where to implement what

| Area | Location | Notes |
|------|----------|--------|
| Onboarding (cyclist type, preferences) | `mobile/src/screens/onboarding/` | Persist to local storage; sync to backend when available |
| Home & route discovery | `mobile/src/screens/home/` | Recommended routes, customise start/end and checkpoints |
| Route config & export | `mobile/src/screens/route/` or `services/maps.ts` | Build Google/Apple Maps URL; open via `Linking.openURL()` |
| Post-ride feedback & rating | `mobile/src/screens/feedback/` | Checkpoint summary + rating submission |
| API client | `mobile/src/services/api.ts` | Point at ALB; auth (e.g. Cognito) when backend is ready |
| Admin stats & dashboards | `web-app/` | Usage, sponsor customisation, health/monitoring |

## Backend contract (placeholder)

Mobile app will call:

- Route recommendation (origin, destination, preferences, optional waypoints) → scored route + waypoints for export.
- Optional: trip/telemetry (batched location) and rating submission.

Exact endpoints and payloads to be aligned with backend team; keep API client in `mobile/src/services/` and types in `mobile/src/types/`.

## Web App (`web-app/`)

A React + Vite + TypeScript SPA deployed on AWS Amplify. Contains:

- `/` — B2C landing page (cyclists)
- `/business` — B2B landing page (sponsors, government agencies)
- `/login` — Partner & Admin login portal
- `/admin` — Admin dashboard (protected, role: `admin`)
- `/dashboard` — Business dashboard (protected, role: `business`)

### Running locally

```bash
cd web-app
npm install
npm run dev        # http://localhost:5173
```

Environment variables live in `web-app/.env.example`. Set `VITE_ANDROID_APK_URL` when you want the landing page to expose the direct APK download.

Demo credentials (mock auth, no backend needed):

| Email | Password | Redirects to |
|-------|----------|-------------|
| `admin@cyclink.com` | any | `/admin` |
| `business@cyclink.com` | any | `/dashboard` |

### Tests

```bash
cd web-app
npm test           # runs all Vitest unit tests
```

15 unit tests covering: auth service, AuthContext (localStorage persistence), and ProtectedRoute (role-based redirect).

### Production build

```bash
cd web-app
npm run build      # TypeScript check + Vite bundle → web-app/dist/
npm run preview    # serve dist/ locally to verify
```

### CI

The `web-ci.yml` workflow runs automatically on every push or PR that touches `web-app/`. It runs the full test suite and production build to catch regressions before merge.

### Deployment

#### Web app hosting on Amplify

AWS Amplify should point at the repository root and use `amplify.yml`, which already scopes the build to `web-app/` with `appRoot: web-app`. Amplify hosts the website only; Android binaries are stored separately in S3.

Required Amplify environment variable:

| Name | Value |
|------|-------|
| `VITE_ANDROID_APK_URL` | Public download URL for the latest APK, for example `https://<bucket>.s3.<region>.amazonaws.com/android/latest.apk` |

If `VITE_ANDROID_APK_URL` is unset, the landing page shows a disabled fallback instead of a broken download link.

#### Android APK upload workflow

`.github/workflows/eas-build.yml` now:
1. Runs only for `mobile/**` changes or changes to the workflow file itself
2. Reuses the existing mobile install + Jest test steps
3. Builds an Android APK with Expo EAS using the `preview` build profile
4. Waits for the EAS build to finish, downloads the APK to the GitHub runner, and uploads:
   - `s3://$AWS_S3_BUCKET/android/latest.apk`
   - `s3://$AWS_S3_BUCKET/android/${GITHUB_SHA}.apk`

Configure these GitHub Actions settings in **Settings → Secrets and variables → Actions**:

| Name | Type | Description |
|------|------|-------------|
| `EXPO_TOKEN` | Secret | Expo/EAS access token already required for `expo/expo-github-action` |
| `AWS_ROLE_TO_ASSUME` | Variable | IAM role ARN that GitHub Actions should assume via OIDC |
| `AWS_REGION` | Variable | AWS region for the S3 bucket, for example `ap-southeast-1` |
| `AWS_S3_BUCKET` | Variable | S3 bucket that stores the Android APK objects |

The workflow uses `aws-actions/configure-aws-credentials@v4` with GitHub OIDC. Do not configure long-lived AWS access keys for this flow.

#### AWS assumptions for public APK downloads

The workflow only uploads the APK objects. For the link in the web app to work, the URL you set in `VITE_ANDROID_APK_URL` must be publicly reachable. Typical options are:

- Public S3 objects or a public S3 prefix for `android/*`
- CloudFront in front of S3 with a public download URL

If you use direct S3 URLs, make sure the bucket policy or access point policy allows `GetObject` for the APK path you expose. The workflow does not set object ACLs.

---

## AI Usage Declaration

This project used AI-assisted development tools as part of the CS5224 Cloud Computing group project.

**Tools used:** Claude Code (Anthropic Claude Sonnet 4.6) via the Claude Code CLI, Claude Opus 4.6 via Antigravity CLI and OpenAI Codex 5.4 via Codex App.

**Scope of AI assistance:**
- Generating the `web-app/` frontend (React + Vite + TypeScript + Tailwind CSS) from a human-authored specification and implementation plan
- Generating the `mobile/` directory using AI-assisted coding for Expo app development.
- Writing and reviewing unit tests (Vitest + React Testing Library)
- Identifying and fixing bugs (accessibility issues, redirect logic, TypeScript type errors)
- Code quality review (accessibility, React anti-patterns, security)

**Human contributions:**
- Project requirements, system design, and architecture decisions
- Review and approval of all design specifications before implementation
- Review and approval of the implementation plan
- Validation of final output against project goals
- All backend, mobile app, and deployment infrastructure work

All AI-generated code was reviewed and approved by the team before being committed.

## Contributing

1. Create a branch, implement under the existing folders (screens, components, services).
2. Avoid renaming or removing the top-level screens/navigation slots so others can merge easily.
3. Add env vars to `.env.example` only (never commit secrets).
