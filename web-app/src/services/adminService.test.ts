import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Enable mock mode before importing the service
import.meta.env.VITE_USE_MOCKS = 'true'

import { getAdminStats, getAdminUsers, getRoutingQualityMetrics } from './adminService'
import { apiFetch } from '../utils/apiFetch'

vi.mock('../utils/apiFetch')
const mockApiFetch = vi.mocked(apiFetch)

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

  describe('getRoutingQualityMetrics()', () => {
    beforeEach(() => {
      import.meta.env.VITE_USE_MOCKS = 'false'
      mockApiFetch.mockResolvedValue(new Response(JSON.stringify({
        total_reviews: 184,
        overall_avg_rating: 3.87,
        total_rides_logged: 412,
        top_rated_routes: [
          { route_id: '6627c3f2a4e1b23d0f9e1001', name: 'East Coast Park Loop', rating: 4.8, review_count: 31 },
        ],
        most_reviewed_routes: [
          { route_id: '6627c3f2a4e1b23d0f9e1003', name: 'Southern Ridges Connector', rating: 4.1, review_count: 57 },
        ],
        total_generated_routes: 89,
        avg_route_computation_ms: 2156.3,
        min_route_computation_ms: 1412.0,
        max_route_computation_ms: 3201.7,
      }), { status: 200 }))
    })

    afterEach(() => {
      import.meta.env.VITE_USE_MOCKS = 'true'
    })

    it('returns a RoutingQualityMetrics object with all required fields', async () => {
      const metrics = await getRoutingQualityMetrics()
      expect(metrics).toHaveProperty('totalReviews')
      expect(metrics).toHaveProperty('overallAvgRating')
      expect(metrics).toHaveProperty('totalRidesLogged')
      expect(metrics).toHaveProperty('topRatedRoutes')
      expect(metrics).toHaveProperty('mostReviewedRoutes')
      expect(metrics).toHaveProperty('totalGeneratedRoutes')
      expect(metrics).toHaveProperty('avgRouteComputationMs')
      expect(metrics).toHaveProperty('minRouteComputationMs')
      expect(metrics).toHaveProperty('maxRouteComputationMs')
    })

    it('maps snake_case backend fields to camelCase frontend fields', async () => {
      const metrics = await getRoutingQualityMetrics()
      expect(metrics.totalReviews).toBe(184)
      expect(metrics.overallAvgRating).toBe(3.87)
      expect(metrics.totalRidesLogged).toBe(412)
      expect(metrics.topRatedRoutes[0].routeId).toBe('6627c3f2a4e1b23d0f9e1001')
      expect(metrics.topRatedRoutes[0].reviewCount).toBe(31)
    })

    it('totalReviews is a non-negative number', async () => {
      const metrics = await getRoutingQualityMetrics()
      expect(typeof metrics.totalReviews).toBe('number')
      expect(metrics.totalReviews).toBeGreaterThanOrEqual(0)
    })

    it('overallAvgRating is null or a number between 1 and 5', async () => {
      const metrics = await getRoutingQualityMetrics()
      if (metrics.overallAvgRating !== null) {
        expect(metrics.overallAvgRating).toBeGreaterThanOrEqual(1)
        expect(metrics.overallAvgRating).toBeLessThanOrEqual(5)
      }
    })

    it('topRatedRoutes is an array of RouteEntry objects', async () => {
      const metrics = await getRoutingQualityMetrics()
      expect(Array.isArray(metrics.topRatedRoutes)).toBe(true)
      metrics.topRatedRoutes.forEach((r) => {
        expect(r).toHaveProperty('routeId')
        expect(r).toHaveProperty('name')
        expect(r).toHaveProperty('rating')
        expect(r).toHaveProperty('reviewCount')
      })
    })

    it('mostReviewedRoutes is an array of RouteEntry objects', async () => {
      const metrics = await getRoutingQualityMetrics()
      expect(Array.isArray(metrics.mostReviewedRoutes)).toBe(true)
      metrics.mostReviewedRoutes.forEach((r) => {
        expect(r).toHaveProperty('routeId')
        expect(r).toHaveProperty('name')
        expect(r).toHaveProperty('rating')
        expect(r).toHaveProperty('reviewCount')
      })
    })

    it('avgRouteComputationMs is null or a positive number', async () => {
      const metrics = await getRoutingQualityMetrics()
      if (metrics.avgRouteComputationMs !== null) {
        expect(metrics.avgRouteComputationMs).toBeGreaterThan(0)
      }
    })

    it('throws on non-ok response', async () => {
      mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 403 }))
      await expect(getRoutingQualityMetrics()).rejects.toThrow('Failed to fetch routing quality metrics.')
    })
  })
})
