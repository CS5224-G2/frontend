import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
})
