import type {
  AdminStats,
  AdminUser,
  AuthResult,
  AuthUser,
  BusinessLandingStats,
  BusinessStats,
  SponsoredLocation,
} from '@shared/types/index'
import {
  mockAdminStats,
  mockAdminUser,
  mockAdminUsers,
  mockAuthUser,
  mockBusinessLandingStats,
  mockBusinessStats,
  mockBusinessUser,
  mockSponsoredLocations,
} from '@shared/mocks/index'
import { hashPassword } from '../utils/passwordHash'

const STORAGE_KEY = 'cyclelink_web_local_db'

// SHA-256('CycleLink123') — pre-computed seed digest for mock users.
// Update this constant if you change the default demo credential.
const SEED_CREDENTIAL_DIGEST = 'bb63bcbb3d935953e5d2141dda133be2ae42747d439c51c3d5364681a5419916'

type StoredUser = AuthUser & {
  passwordHash: string
}

type WebLocalDbState = {
  users: StoredUser[]
  adminStats: AdminStats
  adminUsers: AdminUser[]
  businessStats: BusinessStats
  businessLandingStats: BusinessLandingStats
  sponsoredLocations: SponsoredLocation[]
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()

function createSeedState(): WebLocalDbState {
  return {
    users: [
      { ...mockAuthUser, email: normalizeEmail(mockAuthUser.email), passwordHash: SEED_CREDENTIAL_DIGEST },
      { ...mockAdminUser, email: normalizeEmail(mockAdminUser.email), passwordHash: SEED_CREDENTIAL_DIGEST },
      { ...mockBusinessUser, email: normalizeEmail(mockBusinessUser.email), passwordHash: SEED_CREDENTIAL_DIGEST },
    ],
    adminStats: { ...mockAdminStats },
    adminUsers: [...mockAdminUsers],
    businessStats: { ...mockBusinessStats },
    businessLandingStats: { ...mockBusinessLandingStats },
    sponsoredLocations: [...mockSponsoredLocations],
  }
}

function readState(): WebLocalDbState {
  if (typeof localStorage === 'undefined') {
    return createSeedState()
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seeded = createSeedState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }

  try {
    const state = JSON.parse(raw) as WebLocalDbState
    // Migrate: reseed if stored data still uses the old plaintext-password schema
    if (state.users.length > 0 && 'password' in state.users[0]) {
      const seeded = createSeedState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    return state
  } catch {
    const seeded = createSeedState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }
}

function writeState(state: WebLocalDbState) {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export async function getWebLocalDb(): Promise<WebLocalDbState> {
  const state = readState()
  writeState(state)
  return state
}

export async function findWebUserByEmail(email: string): Promise<StoredUser | null> {
  const state = await getWebLocalDb()
  return state.users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null
}

export async function getStoredAuthResult(email: string): Promise<AuthResult | null> {
  const user = await findWebUserByEmail(email)
  if (!user) {
    return null
  }

  return {
    accessToken: `mock-at-${user.id}`,
    refreshToken: `mock-rt-${user.id}`,
    expiresIn: 3600,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      role: user.role,
    },
  }
}

export async function verifyStoredPassword(email: string, password: string): Promise<boolean> {
  const user = await findWebUserByEmail(email)
  if (!user) return false
  const digest = await hashPassword(password)
  return digest === user.passwordHash
}

export async function getStoredAdminStats(): Promise<AdminStats> {
  const state = await getWebLocalDb()
  return { ...state.adminStats }
}

export async function getStoredAdminUsers(): Promise<AdminUser[]> {
  const state = await getWebLocalDb()
  return [...state.adminUsers]
}

export async function getStoredBusinessStats(): Promise<BusinessStats> {
  const state = await getWebLocalDb()
  return { ...state.businessStats }
}

export async function getStoredBusinessLandingStats(): Promise<BusinessLandingStats> {
  const state = await getWebLocalDb()
  return { ...state.businessLandingStats }
}

export async function getStoredSponsoredLocations(): Promise<SponsoredLocation[]> {
  const state = await getWebLocalDb()
  return [...state.sponsoredLocations]
}

export async function resetWebLocalDb(): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}
