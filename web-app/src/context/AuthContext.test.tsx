import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function TestConsumer() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="role">{user?.role ?? 'none'}</span>
      <button onClick={() => login({ email: 'admin@cyclink.com', password: 'CycleLink123' })}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no user', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('role').textContent).toBe('none')
  })

  it('sets user after login', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await act(async () => {
      screen.getByText('login').click()
      await vi.runAllTimersAsync()
    })
    expect(screen.getByTestId('role').textContent).toBe('admin')
  })

  it('clears user after logout', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await act(async () => {
      screen.getByText('login').click()
      await vi.runAllTimersAsync()
    })
    act(() => { screen.getByText('logout').click() })
    expect(screen.getByTestId('role').textContent).toBe('none')
  })

  it('user remains null when login throws', async () => {
    function BadLoginConsumer() {
      const { user, login } = useAuth()
      return (
        <div>
          <span data-testid="role">{user?.role ?? 'none'}</span>
          <button onClick={() => login({ email: '', password: '' }).catch(() => {})}>bad-login</button>
        </div>
      )
    }
    render(<AuthProvider><BadLoginConsumer /></AuthProvider>)
    await act(async () => {
      screen.getByText('bad-login').click()
      await vi.runAllTimersAsync()
    })
    expect(screen.getByTestId('role').textContent).toBe('none')
  })

  it('hydrates user from localStorage on remount', () => {
    localStorage.setItem(
      'cyclelink_web_session',
      JSON.stringify({
        accessToken: 'mock-at-admin-1',
        refreshToken: 'mock-rt-admin-1',
        expiresIn: 3600,
        user: {
          id: 'admin-1',
          firstName: 'Admin',
          lastName: 'User',
          fullName: 'Admin User',
          email: 'admin@cyclink.com',
          onboardingComplete: true,
          role: 'admin',
        },
      }),
    )

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('role').textContent).toBe('admin')
  })
})
