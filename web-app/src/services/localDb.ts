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
  mockAuthResult,
  mockAuthUser,
  mockBusinessLandingStats,
  mockBusinessStats,
  mockBusinessUser,
  mockSponsoredLocations,
  mockStoredPassword,
} from '@shared/mocks/index'

const STORAGE_KEY = 'cyclelink_web_local_db'

type StoredUser = AuthUser & {
  password: string
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
      { ...mockAuthUser, email: normalizeEmail(mockAuthUser.email), password: mockStoredPassword },
      { ...mockAdminUser, email: normalizeEmail(mockAdminUser.email), password: mockStoredPassword },
      { ...mockBusinessUser, email: normalizeEmail(mockBusinessUser.email), password: mockStoredPassword },
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
    return JSON.parse(raw) as WebLocalDbState
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
    ...mockAuthResult,
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
