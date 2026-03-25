# CycleLink Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Vite + Tailwind web app in `web-app/` with a B2C landing page, B2B landing page, B2B login portal, admin dashboard, and business/sponsor dashboard.

**Architecture:** Single-page React app with React Router v7 for all routes. Mock auth service mirrors the mobile app pattern — role-based redirect on login, token stored in localStorage. Five pages share a green-themed Tailwind design system.

**Tech Stack:** React 19, Vite 8, TypeScript 5.9, React Router DOM 7, Tailwind CSS 3, Vitest, React Testing Library, Lucide React (icons)

**Spec:** `docs/superpowers/specs/2026-03-25-cyclelink-web-app-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `web-app/package.json` | Project config, scripts, dependencies |
| `web-app/vite.config.ts` | Vite + React plugin config |
| `web-app/index.html` | HTML entry point |
| `web-app/tsconfig.json` | TypeScript config |
| `web-app/tailwind.config.js` | Green colour palette, font, content paths |
| `web-app/postcss.config.js` | PostCSS + Tailwind + Autoprefixer |
| `web-app/src/index.css` | Tailwind directives |
| `web-app/src/main.tsx` | React root mount |
| `web-app/src/App.tsx` | Router + ProtectedRoute wiring |
| `web-app/src/services/authService.ts` | Mock login — same shape as mobile |
| `web-app/src/context/AuthContext.tsx` | Auth state, localStorage persistence |
| `web-app/src/components/ProtectedRoute.tsx` | Redirects unauthenticated users to /login |
| `web-app/src/components/StatCard.tsx` | Reusable KPI card |
| `web-app/src/components/Navbar.tsx` | B2C top nav (green-600) |
| `web-app/src/components/BusinessNavbar.tsx` | B2B top nav (green-900) |
| `web-app/src/components/Footer.tsx` | Shared footer |
| `web-app/src/pages/LandingPage.tsx` | `/` — B2C landing |
| `web-app/src/pages/BusinessLandingPage.tsx` | `/business` — B2B landing |
| `web-app/src/pages/LoginPage.tsx` | `/login` — B2B login portal |
| `web-app/src/pages/AdminDashboard.tsx` | `/admin` — system overview + user table |
| `web-app/src/pages/BusinessDashboard.tsx` | `/dashboard` — sponsor overview + location table |

---

## Task 1: Project Scaffold

**Files:**
- Create: `web-app/package.json`
- Create: `web-app/vite.config.ts`
- Create: `web-app/index.html`
- Create: `web-app/tsconfig.json`
- Create: `web-app/tailwind.config.js`
- Create: `web-app/postcss.config.js`
- Create: `web-app/src/index.css`
- Create: `web-app/src/main.tsx`

- [ ] **Step 0: Create the directory structure**

```bash
mkdir -p web-app/src/assets web-app/src/components web-app/src/context web-app/src/pages web-app/src/services web-app/public
```

- [ ] **Step 1: Create `web-app/package.json`**

```json
{
  "name": "cyclelink-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "lucide-react": "^0.577.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.21",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.3",
    "vite": "^8.0.2",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create `web-app/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 3: Create `web-app/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CycleLink</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `web-app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `web-app/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create `web-app/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create `web-app/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create `web-app/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 9: Create `web-app/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Create a minimal `web-app/src/App.tsx` stub so `main.tsx` compiles**

```tsx
export default function App() {
  return <div>CycleLink Web App</div>
}
```

This will be fully replaced in Task 6.

- [ ] **Step 11: Install missing dependencies**

```bash
cd web-app
npm install
```

Expected: installs tailwindcss, vitest, @testing-library/react, jsdom, autoprefixer and any other missing packages.

- [ ] **Step 12: Verify dev server starts**

```bash
cd web-app
npm run dev
```

Expected: Vite dev server starts on http://localhost:5173 (or similar). The page shows "CycleLink Web App" — the App.tsx stub from Step 10.

- [ ] **Step 13: Commit**

```bash
cd web-app
git add package.json vite.config.ts index.html tsconfig.json tailwind.config.js postcss.config.js src/index.css src/main.tsx src/test-setup.ts src/App.tsx
git commit -m "feat(web): scaffold Vite + React + Tailwind project"
```

---

## Task 2: Auth Service

Mock authentication that mirrors `mobile/src/services/authService.ts`. `admin@cyclink.com` returns role `admin`, `business@cyclink.com` returns role `business`.

**Files:**
- Create: `web-app/src/services/authService.ts`
- Create: `web-app/src/services/authService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web-app/src/services/authService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { loginUser } from './authService'

describe('loginUser', () => {
  it('returns admin role for admin@cyclink.com', async () => {
    const result = await loginUser({ email: 'admin@cyclink.com', password: 'any' })
    expect(result.user.role).toBe('admin')
  })

  it('returns business role for business@cyclink.com', async () => {
    const result = await loginUser({ email: 'business@cyclink.com', password: 'any' })
    expect(result.user.role).toBe('business')
  })

  it('returns user role for unknown email', async () => {
    const result = await loginUser({ email: 'cyclist@example.com', password: 'any' })
    expect(result.user.role).toBe('user')
  })

  it('throws if email is empty', async () => {
    await expect(loginUser({ email: '', password: 'any' })).rejects.toThrow()
  })

  it('throws if password is empty', async () => {
    await expect(loginUser({ email: 'admin@cyclink.com', password: '' })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web-app
npm test
```

Expected: FAIL — `loginUser` is not defined yet.

- [ ] **Step 3: Implement `web-app/src/services/authService.ts`**

```typescript
export type LoginValues = {
  email: string
  password: string
}

export type AuthUser = {
  id: string
  email: string
  role: 'user' | 'admin' | 'business'
}

export type AuthResult = {
  accessToken: string
  user: AuthUser
}

export async function loginUser(values: LoginValues): Promise<AuthResult> {
  const email = values.email.trim().toLowerCase()
  const password = values.password

  if (!email) throw new Error('Email is required.')
  if (!password) throw new Error('Password is required.')

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600))

  const role: AuthUser['role'] =
    email === 'admin@cyclink.com'
      ? 'admin'
      : email === 'business@cyclink.com'
        ? 'business'
        : 'user'

  return {
    accessToken: 'mock-token-' + role,
    user: { id: 'mock-' + role, email, role },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web-app
npm test
```

Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add web-app/src/services/
git commit -m "feat(web): add mock auth service with role-based login"
```

---

## Task 3: AuthContext

Wraps the app in authentication state. Persists to `localStorage` so the user stays logged in on refresh.

**Files:**
- Create: `web-app/src/context/AuthContext.tsx`
- Create: `web-app/src/context/AuthContext.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `web-app/src/context/AuthContext.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function TestConsumer() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="role">{user?.role ?? 'none'}</span>
      <button onClick={() => login({ email: 'admin@cyclink.com', password: 'x' })}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear())

  it('starts with no user', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('role').textContent).toBe('none')
  })

  it('sets user after login', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await act(async () => {
      screen.getByText('login').click()
    })
    expect(screen.getByTestId('role').textContent).toBe('admin')
  })

  it('clears user after logout', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await act(async () => { screen.getByText('login').click() })
    act(() => { screen.getByText('logout').click() })
    expect(screen.getByTestId('role').textContent).toBe('none')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web-app
npm test
```

Expected: FAIL — `AuthProvider` and `useAuth` not defined.

- [ ] **Step 3: Implement `web-app/src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginUser, AuthUser, LoginValues } from '../services/authService'

type AuthContextValue = {
  user: AuthUser | null
  login: (values: LoginValues) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'cyclelink_web_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  async function login(values: LoginValues): Promise<AuthUser> {
    const result = await loginUser(values)
    setUser(result.user)
    return result.user
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web-app
npm test
```

Expected: All tests pass (5 auth service + 3 context = 8 total).

- [ ] **Step 5: Commit**

```bash
git add web-app/src/context/
git commit -m "feat(web): add AuthContext with localStorage persistence"
```

---

## Task 4: ProtectedRoute

Redirects unauthenticated users to `/login`, and redirects wrong-role users to their correct dashboard.

**Files:**
- Create: `web-app/src/components/ProtectedRoute.tsx`
- Create: `web-app/src/components/ProtectedRoute.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `web-app/src/components/ProtectedRoute.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AuthUser } from '../services/authService'
import ProtectedRoute from './ProtectedRoute'

function renderWith(user: AuthUser | null, allowedRole: 'admin' | 'business') {
  return render(
    <AuthContext.Provider value={{ user, login: async () => ({ id: '1', email: 'a@b.com', role: 'admin' as const }), logout: () => {} }}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/admin" element={<div>admin page</div>} />
          <Route path="/dashboard" element={<div>dashboard page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRole={allowedRole}>
                <div>protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no user', () => {
    renderWith(null, 'admin')
    expect(screen.getByText('login page')).toBeTruthy()
  })

  it('renders children when role matches', () => {
    renderWith({ id: '1', email: 'a@b.com', role: 'admin' }, 'admin')
    expect(screen.getByText('protected content')).toBeTruthy()
  })

  it('redirects admin to /admin when accessing business route', () => {
    renderWith({ id: '1', email: 'a@b.com', role: 'admin' }, 'business')
    expect(screen.getByText('admin page')).toBeTruthy()
  })

  it('redirects business to /dashboard when accessing admin route', () => {
    renderWith({ id: '1', email: 'a@b.com', role: 'business' }, 'admin')
    expect(screen.getByText('dashboard page')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web-app
npm test
```

Expected: FAIL — `ProtectedRoute` not defined.

- [ ] **Step 3: Implement `web-app/src/components/ProtectedRoute.tsx`**

```tsx
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  allowedRole: 'admin' | 'business'
  children: ReactNode
}

export default function ProtectedRoute({ allowedRole, children }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === allowedRole) return <>{children}</>
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web-app
npm test
```

Expected: All 12 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web-app/src/components/ProtectedRoute.tsx web-app/src/components/ProtectedRoute.test.tsx
git commit -m "feat(web): add ProtectedRoute with role-based redirect"
```

---

## Task 5: Shared Components

Reusable UI pieces used across pages.

**Files:**
- Create: `web-app/src/components/StatCard.tsx`
- Create: `web-app/src/components/Navbar.tsx`
- Create: `web-app/src/components/BusinessNavbar.tsx`
- Create: `web-app/src/components/Footer.tsx`

- [ ] **Step 1: Create `web-app/src/components/StatCard.tsx`**

```tsx
type Props = {
  label: string
  value: string
  accent?: 'green' | 'amber'
}

export default function StatCard({ label, value, accent = 'green' }: Props) {
  const border = accent === 'amber' ? 'border-l-amber-400' : 'border-l-primary-600'
  return (
    <div className={`bg-white rounded-lg p-4 border-l-4 ${border} shadow-sm`}>
      <p className="text-2xl font-extrabold text-primary-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create `web-app/src/components/Navbar.tsx`**

```tsx
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-primary-600 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-lg">
        🚲 CycleLink
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/business" className="text-primary-100 hover:text-white text-sm transition-colors">
          For Business
        </Link>
        <a
          href="#download"
          className="bg-white text-primary-700 font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-primary-50 transition-colors"
        >
          Download App
        </a>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Create `web-app/src/components/BusinessNavbar.tsx`**

```tsx
import { Link } from 'react-router-dom'

export default function BusinessNavbar() {
  return (
    <nav className="bg-primary-900 px-6 py-3 flex items-center justify-between">
      <Link to="/business" className="flex items-center gap-2 text-white font-extrabold text-lg">
        🚲 CycleLink{' '}
        <span className="font-normal text-primary-200 text-sm">Business</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-primary-200 hover:text-white text-sm transition-colors">
          For Cyclists
        </Link>
        <Link
          to="/login"
          className="bg-primary-600 text-white font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-primary-700 transition-colors"
        >
          Partner Login
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create `web-app/src/components/Footer.tsx`**

```tsx
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-primary-200 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="font-extrabold text-white text-lg">🚲 CycleLink</span>
        <div className="flex gap-6 text-sm">
          <Link to="/" className="hover:text-white transition-colors">For Cyclists</Link>
          <Link to="/business" className="hover:text-white transition-colors">For Business</Link>
          <Link to="/login" className="hover:text-white transition-colors">Partner Login</Link>
        </div>
        <p className="text-xs text-primary-400">© 2025 CycleLink. CS5224 Group 2.</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add web-app/src/components/
git commit -m "feat(web): add shared UI components (Navbar, Footer, StatCard)"
```

---

## Task 6: App Router

Wires all routes together and wraps the app in `AuthProvider`.

**Files:**
- Create: `web-app/src/App.tsx`

- [ ] **Step 1: Create `web-app/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import BusinessLandingPage from './pages/BusinessLandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import BusinessDashboard from './pages/BusinessDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/business" element={<BusinessLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="business">
                <BusinessDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Create stub pages so the app compiles**

Create `web-app/src/pages/LandingPage.tsx`:
```tsx
export default function LandingPage() { return <div>Landing</div> }
```
Create `web-app/src/pages/BusinessLandingPage.tsx`:
```tsx
export default function BusinessLandingPage() { return <div>Business</div> }
```
Create `web-app/src/pages/LoginPage.tsx`:
```tsx
export default function LoginPage() { return <div>Login</div> }
```
Create `web-app/src/pages/AdminDashboard.tsx`:
```tsx
export default function AdminDashboard() { return <div>Admin</div> }
```
Create `web-app/src/pages/BusinessDashboard.tsx`:
```tsx
export default function BusinessDashboard() { return <div>Business Dashboard</div> }
```

- [ ] **Step 3: Verify the app compiles and loads in the browser**

```bash
cd web-app
npm run dev
```

Open http://localhost:5173 — should show "Landing". Navigate to /business, /login, /admin, /dashboard — each shows its stub text. `/admin` and `/dashboard` should redirect to `/login` since you're not logged in.

- [ ] **Step 4: Run all tests**

```bash
cd web-app
npm test
```

Expected: All 12 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add web-app/src/App.tsx web-app/src/pages/
git commit -m "feat(web): wire up React Router with all 5 routes"
```

---

## Task 7: B2C Landing Page

**Files:**
- Modify: `web-app/src/pages/LandingPage.tsx` (replace stub)

- [ ] **Step 1: Implement `web-app/src/pages/LandingPage.tsx`**

```tsx
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const features = [
  { emoji: '🌿', title: 'Shade-Aware', desc: 'Routes rated by tree coverage so you stay cool' },
  { emoji: '⛅', title: 'Weather-Smart', desc: 'Live NEA data — avoid haze and afternoon rain' },
  { emoji: '🏮', title: 'Heritage Trails', desc: 'Hawker centres and historic sites as waypoints' },
]

const steps = [
  { n: '1', label: 'Set your preferences' },
  { n: '2', label: 'Get your best route' },
  { n: '3', label: 'Ride & rate it' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 px-6 py-16">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-black text-primary-900 leading-tight mb-4">
              Smarter cycling<br />across Singapore.
            </h1>
            <p className="text-primary-800 text-lg mb-8">
              Personalised routes scored by shade, weather, difficulty &amp; heritage.
            </p>
            <div id="download" className="flex gap-3 flex-wrap">
              <a
                href="#"
                className="bg-primary-900 text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2"
              >
                🍎 App Store
              </a>
              <a
                href="#"
                className="bg-primary-900 text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2"
              >
                ▶ Google Play
              </a>
            </div>
          </div>
          <div className="w-40 h-56 bg-primary-200 rounded-2xl flex items-center justify-center text-6xl flex-shrink-0">
            📱
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-8 text-center">
            Why CycleLink?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-primary-50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-primary-900 mb-1">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-8 text-center">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg mx-auto mb-2">
                    {s.n}
                  </div>
                  <p className="text-sm font-medium text-primary-900">{s.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <span className="text-primary-300 text-2xl hidden sm:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Check in browser**

```bash
cd web-app
npm run dev
```

Open http://localhost:5173. Should show the full B2C landing page with hero, features and how-it-works sections. Click "For Business" in the nav — should navigate to `/business` (stub for now).

- [ ] **Step 3: Commit**

```bash
git add web-app/src/pages/LandingPage.tsx
git commit -m "feat(web): implement B2C landing page"
```

---

## Task 8: B2B Landing Page

**Files:**
- Modify: `web-app/src/pages/BusinessLandingPage.tsx` (replace stub)

- [ ] **Step 1: Implement `web-app/src/pages/BusinessLandingPage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import BusinessNavbar from '../components/BusinessNavbar'
import Footer from '../components/Footer'

const offerings = [
  {
    emoji: '📍',
    title: 'Sponsored Waypoints',
    desc: 'Feature your hawker centre, venue, or heritage site on recommended routes',
  },
  {
    emoji: '📊',
    title: 'Mobility Analytics',
    desc: 'Anonymised route demand and cyclist behaviour data for institutional buyers',
  },
  {
    emoji: '🏛️',
    title: 'Government Partnerships',
    desc: 'Built for LTA, NParks, STB, and HPB — agencies whose mandate aligns with active mobility',
  },
]

const stats = [
  { value: '5,000+', label: 'Monthly Users' },
  { value: '50,000', label: 'Route Requests/mo' },
  { value: '8', label: 'Active Partners' },
]

export default function BusinessLandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <BusinessNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            Reach Singapore's growing<br />cycling community.
          </h1>
          <p className="text-primary-200 text-lg mb-8">
            Sponsor routes. Buy mobility data. Partner with CycleLink.
          </p>
          <Link
            to="/login"
            className="inline-block bg-primary-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-700 transition-colors text-lg"
          >
            Become a Partner →
          </Link>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-8 text-center">
            What we offer
          </h2>
          <div className="flex flex-col gap-4">
            {offerings.map((o) => (
              <div key={o.title} className="flex gap-4 items-start bg-primary-50 rounded-2xl p-5">
                <span className="text-3xl flex-shrink-0">{o.emoji}</span>
                <div>
                  <h3 className="font-bold text-primary-900 mb-1">{o.title}</h3>
                  <p className="text-slate-600 text-sm">{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="bg-primary-50 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-extrabold text-primary-900 mb-6 text-center">
            Platform at a glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-black text-primary-600">{s.value}</p>
                <p className="text-slate-600 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-900 px-6 py-12 text-center">
        <p className="text-white text-xl font-bold mb-4">
          Ready to reach Singapore's cyclists?
        </p>
        <Link
          to="/login"
          className="inline-block bg-white text-primary-900 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors"
        >
          Access Partner Portal →
        </Link>
      </section>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Check in browser**

Open http://localhost:5173/business. Should show B2B landing page with dark hero, offerings list, and stats. "Partner Login" and "Become a Partner" buttons should link to `/login`.

- [ ] **Step 3: Commit**

```bash
git add web-app/src/pages/BusinessLandingPage.tsx
git commit -m "feat(web): implement B2B landing page"
```

---

## Task 9: Login Page

**Files:**
- Modify: `web-app/src/pages/LoginPage.tsx` (replace stub)

- [ ] **Step 1: Implement `web-app/src/pages/LoginPage.tsx`**

```tsx
import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in — redirect using Navigate component (safe during render)
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login({ email, password })
      // Navigate based on the role returned by the auth service
      if (result.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (result.role === 'business') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-2xl font-black text-primary-900">🚲 CycleLink</p>
          <p className="text-slate-500 text-sm mt-1">Partner &amp; Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="admin@cyclink.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white font-bold py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-5 bg-primary-50 rounded-xl p-4 text-xs text-slate-600">
          <p className="font-semibold text-primary-800 mb-2">Demo credentials</p>
          <p>Admin: <span className="font-mono">admin@cyclink.com</span></p>
          <p>Business: <span className="font-mono">business@cyclink.com</span></p>
          <p className="text-slate-400 mt-1">Password: any value</p>
        </div>

        <Link
          to="/"
          className="block text-center text-xs text-slate-400 hover:text-primary-600 mt-4 transition-colors"
        >
          ← Back to cyclelink.com
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check in browser**

Open http://localhost:5173/login. Enter `admin@cyclink.com` + any password → should redirect to `/admin`. Enter `business@cyclink.com` → should redirect to `/dashboard`. Empty fields should show validation.

- [ ] **Step 3: Commit**

```bash
git add web-app/src/pages/LoginPage.tsx
git commit -m "feat(web): implement B2B login portal with role-based redirect"
```

---

## Task 10: Admin Dashboard

**Files:**
- Modify: `web-app/src/pages/AdminDashboard.tsx` (replace stub)

- [ ] **Step 1: Implement `web-app/src/pages/AdminDashboard.tsx`**

```tsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'

type NavItem = { label: string; icon: string }

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: '📊' },
  { label: 'Users', icon: '👥' },
  { label: 'Routes', icon: '🗺️' },
  { label: 'Reports', icon: '⚠️' },
  { label: 'Settings', icon: '⚙️' },
]

const STATS = [
  { label: 'Total Rides', value: '1,280' },
  { label: 'Active Users', value: '452' },
  { label: 'Revenue', value: '$12.4k' },
  { label: 'Open Reports', value: '12', accent: 'amber' as const },
]

const USERS = [
  { email: 'alex@email.com', role: 'user', status: 'Active', joined: 'Jan 2025' },
  { email: 'jamie@email.com', role: 'user', status: 'Active', joined: 'Feb 2025' },
  { email: 'grace@email.com', role: 'user', status: 'Inactive', joined: 'Feb 2025' },
  { email: 'admin@cyclink.com', role: 'admin', status: 'Active', joined: 'Jan 2025' },
  { email: 'business@cyclink.com', role: 'business', status: 'Active', joined: 'Jan 2025' },
]

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Overview')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-52 bg-primary-900 flex flex-col flex-shrink-0">
        <div className="px-4 py-5">
          <p className="text-white font-extrabold text-base">🚲 Admin</p>
        </div>
        <nav className="flex-1 flex flex-col">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                activeNav === item.label
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-primary-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mx-4 mb-4 text-sm text-primary-300 hover:text-red-400 transition-colors text-left px-2 py-2"
        >
          ↩ Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-slate-50 p-6 overflow-auto">
        <h1 className="text-xl font-extrabold text-primary-900 mb-1">System Overview</h1>
        <p className="text-slate-500 text-sm mb-6">Admin Panel — CycleLink</p>

        {activeNav === 'Overview' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {STATS.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-primary-900 mb-4">User Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 pr-4 font-medium">Email</th>
                      <th className="pb-2 pr-4 font-medium">Role</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USERS.map((u) => (
                      <tr key={u.email} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 text-slate-700">{u.email}</td>
                        <td className="py-3 pr-4 text-slate-500">{u.role}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              u.status === 'Active'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{u.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
            <p className="text-3xl mb-3">🚧</p>
            <p className="font-semibold">{activeNav} — Coming soon</p>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Check in browser**

Log in at `/login` with `admin@cyclink.com`. Should see the admin dashboard with 4 KPI cards and user table. Clicking "Users", "Routes", etc. should show the "Coming soon" placeholder. Clicking Logout should return to `/login`.

- [ ] **Step 3: Commit**

```bash
git add web-app/src/pages/AdminDashboard.tsx
git commit -m "feat(web): implement admin dashboard with stats and user table"
```

---

## Task 11: Business Dashboard

**Files:**
- Modify: `web-app/src/pages/BusinessDashboard.tsx` (replace stub)

- [ ] **Step 1: Implement `web-app/src/pages/BusinessDashboard.tsx`**

```tsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'

type NavItem = { label: string; icon: string }

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: '📊' },
  { label: 'Sponsorships', icon: '📍' },
  { label: 'Data Insights', icon: '📈' },
  { label: 'Settings', icon: '⚙️' },
]

const STATS = [
  { label: 'Active Sponsors', value: '8' },
  { label: 'Data Points', value: '45.2k' },
  { label: 'Total Spent', value: '$3,420' },
  { label: 'User Reach', value: '8.5k' },
]

const LOCATIONS = [
  { venue: 'Maxwell Food Centre', location: 'Tanjong Pagar', views: '1,200', clicks: '340', status: 'Live' },
  { venue: 'East Coast Park', location: 'Marine Parade', views: '980', clicks: '210', status: 'Pending' },
  { venue: 'Chinatown Heritage Trail', location: 'Chinatown', views: '750', clicks: '180', status: 'Live' },
  { venue: 'Bedok Interchange', location: 'Bedok', views: '620', clicks: '145', status: 'Pending' },
]

export default function BusinessDashboard() {
  const { logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Overview')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-52 bg-primary-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-5">
          <p className="text-white font-extrabold text-base">🚲 Business</p>
        </div>
        <nav className="flex-1 flex flex-col">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                activeNav === item.label
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-primary-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mx-4 mb-4 text-sm text-primary-300 hover:text-red-400 transition-colors text-left px-2 py-2"
        >
          ↩ Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-slate-50 p-6 overflow-auto">
        <h1 className="text-xl font-extrabold text-primary-900 mb-1">Business Overview</h1>
        <p className="text-slate-500 text-sm mb-6">Partner Portal — CycleLink</p>

        {activeNav === 'Overview' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {STATS.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} />
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-primary-900 mb-4">Sponsored Locations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 pr-4 font-medium">Venue</th>
                      <th className="pb-2 pr-4 font-medium">Location</th>
                      <th className="pb-2 pr-4 font-medium">Views</th>
                      <th className="pb-2 pr-4 font-medium">Clicks</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOCATIONS.map((l) => (
                      <tr key={l.venue} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-700">{l.venue}</td>
                        <td className="py-3 pr-4 text-slate-500">{l.location}</td>
                        <td className="py-3 pr-4 text-slate-600">{l.views}</td>
                        <td className="py-3 pr-4 text-slate-600">{l.clicks}</td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              l.status === 'Live'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
            <p className="text-3xl mb-3">🚧</p>
            <p className="font-semibold">{activeNav} — Coming soon</p>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Check in browser**

Log in with `business@cyclink.com`. Should see business dashboard with 4 KPI cards and sponsored locations table. Clicking "Sponsorships", "Data Insights" shows "Coming soon". Logout returns to `/login`.

- [ ] **Step 3: Run all tests one final time**

```bash
cd web-app
npm test
```

Expected: All 12 tests pass.

- [ ] **Step 4: Commit**

```bash
git add web-app/src/pages/BusinessDashboard.tsx
git commit -m "feat(web): implement business dashboard with stats and sponsor table"
```

---

## Task 12: Final Build Verification

- [ ] **Step 1: Run production build**

```bash
cd web-app
npm run build
```

Expected: `dist/` folder created with no TypeScript or build errors.

- [ ] **Step 2: Preview production build**

```bash
cd web-app
npm run preview
```

Open the preview URL and verify all 5 routes work, login redirects correctly, and dashboards display properly.

- [ ] **Step 3: Add `.superpowers/` to `.gitignore` if not already there**

Check `frontend/.gitignore` (or create it) and add:
```
.superpowers/
web-app/node_modules/
web-app/dist/
```

- [ ] **Step 4: Final commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers and web-app build artifacts"
```
