# Frontend design reference (CycleLink)

Short reference extracted from the Prelim Report. Full detail in the Prelim Report.

## Approach

- **Stack over live navigation:** We generate and recommend the route; the user opens it in **Google Maps** or **Apple Maps** for turn-by-turn navigation.
- **Mobile:** Expo (React Native). Distribution via App Store and Google Play; client talks to AWS ALB.
- **Telemetry (optional):** GPS buffered in SQLite, batched uploads (e.g. 60 s) to backend.

## User flow

1. **Onboarding** — Select cyclist type and preferences (shade, elevation, cultural richness, etc.).
2. **Home** — Discover recommended routes or customise a route (start/end, preferences, checkpoints).
3. **Export** — Confirm settings → open recommended route in Google/Apple Maps via deep link (origin, destination, waypoints from backend).
4. **During ride** — Navigation runs in the external map app.
5. **Return** — In CycleLink: checkpoint arrival feedback, short details for scenic locations; then **rate the route** and submit feedback.

## Scoring dimensions (backend)

Routes are scored on: shade coverage, weather, route difficulty (elevation/terrain), cultural richness (hawker centres, heritage). User weights drive the recommended route.

## Admin dashboard (web)

- Hosted on S3 + CloudFront.
- Usage statistics, sponsor admin (advertised scenic locations), developer dashboard (health, usage).

## Integration points

- **Backend:** ALB → ECS (core API + route recommendation). Auth (e.g. Cognito) when available.
- **Maps export:** Build URL with origin, destination, waypoints; open with `Linking.openURL()`.
- **Optional hybrid tracking:** Background location + batched upload; trip-end is heuristic (e.g. geofence or user reopens app).
