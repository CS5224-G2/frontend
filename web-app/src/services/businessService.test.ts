import { describe, it, expect } from 'vitest'

import.meta.env.VITE_USE_MOCKS = 'true'

import { getBusinessStats, getSponsoredLocations } from './businessService'

describe('businessService (mock mode)', () => {
  describe('getBusinessStats()', () => {
    it('returns a BusinessStats object', async () => {
      const stats = await getBusinessStats()
      expect(stats).toHaveProperty('activeSponsors')
      expect(stats).toHaveProperty('dataPoints')
      expect(stats).toHaveProperty('totalSpentFormatted')
      expect(stats).toHaveProperty('userReach')
    })

    it('activeSponsors is a positive number', async () => {
      const stats = await getBusinessStats()
      expect(stats.activeSponsors).toBeGreaterThan(0)
    })
  })

  describe('getSponsoredLocations()', () => {
    it('returns an array of SponsoredLocation objects', async () => {
      const locations = await getSponsoredLocations()
      expect(Array.isArray(locations)).toBe(true)
      expect(locations.length).toBeGreaterThan(0)
    })

    it('each location has the required fields', async () => {
      const locations = await getSponsoredLocations()
      locations.forEach((l) => {
        expect(l).toHaveProperty('id')
        expect(l).toHaveProperty('venue')
        expect(l).toHaveProperty('location')
        expect(l).toHaveProperty('views')
        expect(l).toHaveProperty('clicks')
        expect(l).toHaveProperty('status')
      })
    })

    it('status is either Live or Pending', async () => {
      const locations = await getSponsoredLocations()
      locations.forEach((l) => {
        expect(['Live', 'Pending']).toContain(l.status)
      })
    })

    it('contains at least one Live and one Pending location', async () => {
      const locations = await getSponsoredLocations()
      expect(locations.some((l) => l.status === 'Live')).toBe(true)
      expect(locations.some((l) => l.status === 'Pending')).toBe(true)
    })
  })
})
