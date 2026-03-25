import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import type { AuthUser } from '../services/authService'
import ProtectedRoute from './ProtectedRoute'

function makeCtx(user: AuthUser | null) {
  return {
    user,
    login: async () => { throw new Error('login not implemented in test stub') },
    logout: () => {},
  }
}

function renderInRouter(allowedRole: AuthUser['role'], user: AuthUser | null, initialEntry = '/protected') {
  return render(
    <AuthContext.Provider value={makeCtx(user)}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute allowedRole={allowedRole}><span>secret</span></ProtectedRoute>} />
          <Route path="/" element={<span>home page</span>} />
          <Route path="/login" element={<span>login page</span>} />
          <Route path="/admin" element={<span>admin page</span>} />
          <Route path="/dashboard" element={<span>dashboard page</span>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no user', () => {
    renderInRouter('admin', null)
    expect(screen.getByText('login page')).toBeTruthy()
  })

  it('renders children when role matches', () => {
    const admin: AuthUser = { id: '1', email: 'a@b.com', role: 'admin', firstName: 'Admin', lastName: 'User', fullName: 'Admin User', onboardingComplete: true }
    renderInRouter('admin', admin)
    expect(screen.getByText('secret')).toBeTruthy()
  })

  it('redirects admin to /admin when accessing business route', () => {
    const admin: AuthUser = { id: '1', email: 'a@b.com', role: 'admin', firstName: 'Admin', lastName: 'User', fullName: 'Admin User', onboardingComplete: true }
    renderInRouter('business', admin)
    expect(screen.getByText('admin page')).toBeTruthy()
  })

  it('redirects business to /dashboard when accessing admin route', () => {
    const biz: AuthUser = { id: '2', email: 'b@b.com', role: 'business', firstName: 'Business', lastName: 'User', fullName: 'Business User', onboardingComplete: true }
    renderInRouter('admin', biz)
    expect(screen.getByText('dashboard page')).toBeTruthy()
  })

  it('redirects user role to / when accessing protected route', () => {
    const regularUser: AuthUser = { id: '3', email: 'u@b.com', role: 'user', firstName: 'Regular', lastName: 'User', fullName: 'Regular User', onboardingComplete: true }
    renderInRouter('admin', regularUser)
    expect(screen.getByText('home page')).toBeTruthy()
  })
})
