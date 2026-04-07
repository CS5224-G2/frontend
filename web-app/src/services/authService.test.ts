import { describe, it, expect } from 'vitest'
import { loginUser, requestPasswordReset, resetPassword } from './authService'

describe('loginUser', () => {
  it('returns admin role for admin@cyclink.com', async () => {
    const result = await loginUser({ email: 'admin@cyclink.com', password: 'CycleLink123' })
    expect(result.user.role).toBe('admin')
  })

  it('returns business role for business@cyclink.com', async () => {
    const result = await loginUser({ email: 'business@cyclink.com', password: 'CycleLink123' })
    expect(result.user.role).toBe('business')
  })

  it('returns user role for alex@example.com', async () => {
    const result = await loginUser({ email: 'alex@example.com', password: 'CycleLink123' })
    expect(result.user.role).toBe('user')
  })

  it('throws if email is empty', async () => {
    await expect(loginUser({ email: '', password: 'any' })).rejects.toThrow()
  })

  it('throws if password is empty', async () => {
    await expect(loginUser({ email: 'admin@cyclink.com', password: '' })).rejects.toThrow()
  })

  it('throws for an unknown email in mock mode', async () => {
    await expect(loginUser({ email: 'cyclist@example.com', password: 'CycleLink123' })).rejects.toThrow(
      'Invalid email or password.'
    )
  })

  it('throws for an invalid password in mock mode', async () => {
    await expect(loginUser({ email: 'admin@cyclink.com', password: 'wrong-password' })).rejects.toThrow(
      'Invalid email or password.'
    )
  })
})

describe('requestPasswordReset', () => {
  it('returns a generic message in mock mode', async () => {
    await expect(requestPasswordReset('alex@example.com')).resolves.toContain('reset link')
  })

  it('throws if email is empty', async () => {
    await expect(requestPasswordReset('')).rejects.toThrow('Email is required.')
  })
})

describe('resetPassword', () => {
  it('returns a success message in mock mode', async () => {
    await expect(resetPassword('mock-token', 'NewPassword123!')).resolves.toContain('successful')
  })

  it('throws if token is empty', async () => {
    await expect(resetPassword('', 'NewPassword123!')).rejects.toThrow('Reset token is required.')
  })

  it('throws if the new password is empty', async () => {
    await expect(resetPassword('mock-token', '')).rejects.toThrow('New password is required.')
  })
})
