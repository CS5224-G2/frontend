# Dashboard Polish — Design Spec
**Date:** 2026-04-03
**Status:** Approved

## Overview

Polish the CycleLink Evaluation Dashboard to remove AI aesthetics, add dark mode, surface latency percentiles, and introduce a read-only user management tab.

---

## 1. Remove Emojis — Replace with Lucide Icons

All emoji strings (`👥`, `🚴`, `🔄`, `📅`, `⚙️`, `🎯`, `📋`, `🚲`) are replaced with Lucide React SVG components. Lucide is already installed (`lucide-react` in package.json).

**MetricCard change:** The `icon` prop currently renders `<span className="text-lg">{icon}</span>`. Update to render any ReactNode — a Lucide component passed as `icon` will render at `size={14}` with `className="text-zinc-400 dark:text-zinc-500"`.

**Icon mapping:**
| Location | Emoji | Lucide icon |
|---|---|---|
| Total Sign-ups | 👥 | `Users` |
| Ride Completion Rate | 🚴 | `TrendingUp` |
| 7-Day Return | 🔄 | `RefreshCw` |
| 30-Day Return | 📅 | `CalendarDays` |
| Active Weight Config | ⚙️ | `Settings2` |
| Avg Alignment Score | 🎯 | `Crosshair` |
| Next Validation Review | 📋 | `ClipboardList` |
| Avg Response Time | — | `Clock` |
| p95 Response Time | — | `Activity` |
| p99 Response Time | — | `AlertTriangle` |
| Header logo | 🚲 | Remove — use text wordmark only |

---

## 2. Dark Mode

### Strategy
Tailwind `darkMode: 'class'` — dark mode activates when `<html>` has the `dark` class.

### Default and toggle
- On first load: read `window.matchMedia('(prefers-color-scheme: dark)').matches`. Apply `dark` class if true.
- User can override with a sun/moon toggle button in the dashboard header. Preference is saved to `localStorage` under key `cl_theme`.
- On subsequent loads: read `localStorage.getItem('cl_theme')` first; fall back to system preference if not set.

### Toggle button
Placed in the header right-hand side, before "Sign out". Uses Lucide `Sun` (shown in dark mode, click to go light) and `Moon` (shown in light mode, click to go dark).

### Dark mode state
Managed inside `EvaluationDashboard.jsx` with a `useState` + `useEffect`. The effect applies/removes the `dark` class on `document.documentElement` and persists to `localStorage`.

### Color palette

| Token | Light | Dark |
|---|---|---|
| Page background | `bg-slate-50` | `dark:bg-zinc-950` |
| Card/surface | `bg-white` | `dark:bg-zinc-900` |
| Card border | `border-slate-200` | `dark:border-zinc-800` |
| Primary text | `text-slate-900` | `dark:text-zinc-100` |
| Muted text | `text-slate-400` | `dark:text-zinc-500` |
| Section badge bg | `bg-primary-100` | `dark:bg-green-900/30` |
| Section badge text | `text-primary-700` | `dark:text-green-400` |

All dashboard components (`MetricCard`, `SectionLabel`, `StatusPanel`, `InfrastructureLogs`, `EvaluationDashboard`) receive `dark:` variants via Tailwind classes. No CSS variables or separate stylesheets — Tailwind only.

### Chart.js dark mode
Chart label, grid, and title colors are toggled by passing a `isDark` boolean from `EvaluationDashboard` to chart option builders. Dark values: grid `#27272a`, ticks `#71717a`, title `#f4f4f5`.

---

## 3. Latency Percentiles (p95 / p99 / avg)

### Data source
`GET /v1/admin/infrastructure-metrics` → `alb.TargetResponseTime` — array of ~96 objects `{ timestamp, value }` (15-min windows over 24h). Values are in **milliseconds**.

### Computation
Add a pure utility function in `EvaluationDashboard.jsx`:

```js
function computePercentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, idx)]);
}
```

Derive three values from `alb.TargetResponseTime`:
- **avg** — `Math.round(values.reduce((s, v) => s + v, 0) / values.length)`
- **p95** — `computePercentile(values, 95)`
- **p99** — `computePercentile(values, 99)`

### Display
Three `MetricCard` components placed above the existing CPU/latency charts in Section 2, in a `grid-cols-3` row:

| Card | Icon | Value color |
|---|---|---|
| Avg Response Time | `Clock` | green (`text-green-500`) |
| p95 Response Time | `Activity` | amber (`text-amber-500`) if > 300ms, else green |
| p99 Response Time | `AlertTriangle` | red (`text-red-400`) if > 500ms, amber if > 300ms, else green |

Subtitle: `"24h mean · ALB data"` / `"Derived from 96 ALB windows"`.

When `metrics` is null (loading or error), cards show loading skeleton via `loading` prop.

---

## 4. Tab Navigation

### Structure
A tab bar sits between the sticky header and the page content. Two tabs:

| Tab | Icon | Content |
|---|---|---|
| Overview | `LayoutDashboard` | Existing 3 sections (User Engagement, System Performance, Routing Quality) |
| Users | `Users` | User management table |

Tab state is `useState('overview' | 'users')` inside `EvaluationDashboard.jsx`. Active tab indicator: 2px bottom border in `border-green-500`, inactive text `text-zinc-500`.

### Tab bar styling
- Light: `bg-white border-b border-slate-200`
- Dark: `dark:bg-zinc-900 dark:border-zinc-800`

---

## 5. User Management Tab

### Data
`GET /v1/admin/users` — already fetched by `useAdminStats`. **Reuse this data** — do not create a separate hook. The `users` array (raw response before `.length`) is passed down to the Users tab.

Update `useAdminStats` to expose the raw `users` array alongside the derived counts:
```js
setData({
  totalUsers: users.length,
  users: users,   // add this
  activeUsers: stats.active_users,
  ...
});
```

### New component: `UserManagement.jsx`

Props: `{ users, loading, error }`

**Features:**
- Search input (client-side filter on `email` and `role`) — no API call on search
- Table columns: Email, Role, Status, Joined
- Role badge: `admin` → green, `user` / `business` → zinc
- Status badge: `Active` → green, `Inactive` → red-tinted
- No delete button, no create admin button (API not available)
- Empty state when search returns no results
- Loading skeleton (3 placeholder rows)

### No new hook needed
Data comes from the existing `useAdminStats` call. This avoids a duplicate `/admin/users` fetch.

---

## Files Changed

| File | Change |
|---|---|
| `web-app/tailwind.config.js` | Add `darkMode: 'class'` |
| `web-app/src/dashboard/EvaluationDashboard.jsx` | Dark mode state + toggle, tab state, Lucide icons, latency cards, `dark:` classes, pass `users` to UserManagement |
| `web-app/src/dashboard/components/MetricCard.jsx` | Accept ReactNode icon, add `dark:` classes |
| `web-app/src/dashboard/components/SectionLabel.jsx` | Add `dark:` classes |
| `web-app/src/dashboard/components/StatusPanel.jsx` | Add `dark:` classes |
| `web-app/src/dashboard/components/InfrastructureLogs.jsx` | Add `dark:` classes |
| `web-app/src/dashboard/hooks/useAdminStats.js` | Expose raw `users` array in returned data |
| `web-app/src/dashboard/components/UserManagement.jsx` | **New** — user list table with search |

---

## Out of Scope

- Delete user / create admin (no backend endpoints)
- Pagination on the user table (load all, client-side filter only)
- Chart theme switching animation
- Mobile layout
