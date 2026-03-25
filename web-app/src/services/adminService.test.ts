import { describe, it, expect } from 'vitest'

// Enable mock mode before importing the service
import.meta.env.VITE_USE_MOCKS = 'true'

import { getAdminStats, getAdminUsers } from './adminService'

describe('adminService (mock mode)', () => {
  describe('getAdminStats()', () => {
    it('returns an AdminStats object', async () => {
      const stats = await getAdminStats()
      expect(stats).toHaveProperty('totalRides')
      expect(stats).toHaveProperty('activeUsers')
      expect(stats).toHaveProperty('revenueFormatted')
      expect(stats).toHaveProperty('openReports')
    })

    it('totalRides is a positive number', async () => {
      const stats = await getAdminStats()
      expect(stats.totalRides).toBeGreaterThan(0)
    })

    it('openReports is a non-negative number', async () => {
      const stats = await getAdminStats()
      expect(stats.openReports).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getAdminUsers()', () => {
    it('returns an array of AdminUser objects', async () => {
      const users = await getAdminUsers()
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBeGreaterThan(0)
    })

    it('each user has the required fields', async () => {
      const users = await getAdminUsers()
      users.forEach((u) => {
        expect(u).toHaveProperty('id')
        expect(u).toHaveProperty('email')
        expect(u).toHaveProperty('role')
        expect(u).toHaveProperty('status')
        expect(u).toHaveProperty('joinedFormatted')
      })
    })

    it('contains an admin role user', async () => {
      const users = await getAdminUsers()
      const admin = users.find((u) => u.role === 'admin')
      expect(admin).toBeDefined()
    })

    it('status is either Active or Inactive', async () => {
      const users = await getAdminUsers()
      users.forEach((u) => {
        expect(['Active', 'Inactive']).toContain(u.status)
      })
    })
  })
})
