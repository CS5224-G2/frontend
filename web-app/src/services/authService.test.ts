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
