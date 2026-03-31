import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getMockAuthResult,
  mockAdminStats,
  mockAdminUsers,
  mockRoutes,
} from '@shared/mocks/index'
import useLatencyPoller from './useLatencyPoller'

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')

const API_ROOT = `${BASE_URL}/v1`
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL?.trim() || ''
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD?.trim() || ''
const REFRESH_LEEWAY_MS = 60_000
const RETRY_DELAY_MS = 2_000
const DAY_MS = 24 * 60 * 60 * 1000
const DIMENSIONS = ['shade', 'heritage', 'difficulty', 'weather']
let cachedDashboardCredentials = null
let cachedDashboardSession = null

const DIMENSION_LABELS = {
  shade: 'Shade',
  heritage: 'Heritage',
  difficulty: 'Difficulty',
  weather: 'Weather',
}

const TEST_ROUTE_TEMPLATE = {
  start_point: {
    name: 'Raffles Place MRT',
    lat: 1.2837,
    lng: 103.8515,
    source: 'search',
  },
  end_point: {
    name: 'East Coast Park',
    lat: 1.3025,
    lng: 103.9128,
    source: 'current-location',
  },
  checkpoints: [
    {
      id: 'checkpoint-1',
      name: 'Marina Barrage',
      lat: 1.2808,
      lng: 103.8707,
      source: 'map',
      description: 'Pinned checkpoint for evaluation dashboard probes',
    },
  ],
  limit: 3,
}

function createMetricState() {
  return {
    loading: true,
    error: '',
    value: '--',
    delta: 'Waiting for data',
    tone: 'neutral',
  }
}

function createChartState(title, subtitle = '') {
  return {
    loading: true,
    error: '',
    title,
    subtitle,
    labels: [],
    datasets: [],
  }
}

function createEmptySummary() {
  return {
    totalUsers: createMetricState(),
    signups30d: createMetricState(),
    return7d: createMetricState(),
    return30d: createMetricState(),
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function round(value) {
  if (!Number.isFinite(value)) return 0
  return Math.round(value)
}

function formatInteger(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(round(value))
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '--'
  return `${round(value)}%`
}

function formatShortDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '--'
  if (ms < 1000) return `${round(ms)} ms`

  const seconds = ms / 1000
  if (seconds < 60) return `${round(seconds)} s`

  const minutes = seconds / 60
  return `${round(minutes)} min`
}

function formatFutureDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'TBD'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function percent(value, total) {
  if (!total) return 0
  return (value / total) * 100
}

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function percentile(values, percentileValue) {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(percentileValue * sorted.length) - 1),
  )
  return sorted[index]
}

function parseDateLike(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  const monthYear = new Date(`${trimmed} 01`)
  return Number.isNaN(monthYear.getTime()) ? null : monthYear
}

function getPathValue(source, path) {
  return path.split('.').reduce((current, segment) => {
    if (current == null) return undefined
    return current[segment]
  }, source)
}

function firstDefined(source, paths) {
  for (const path of paths) {
    const value = getPathValue(source, path)
    if (value !== undefined && value !== null && value !== '') return value
  }

  return undefined
}

function readNumber(source, paths) {
  const value = firstDefined(source, paths)
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }

  return null
}

function readString(source, paths) {
  const value = firstDefined(source, paths)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readDate(source, paths) {
  return parseDateLike(firstDefined(source, paths))
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload

  const candidates = [
    payload?.items,
    payload?.results,
    payload?.data,
    payload?.data?.items,
    payload?.data?.results,
    payload?.routes,
    payload?.payload,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  return []
}

function splitPath(input) {
  const [pathname, query = ''] = input.split('?')
  return {
    pathname,
    params: new URLSearchParams(query),
  }
}

function startOfWeek(date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() + diff)
  return copy
}

function formatWeekLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function cloneRoute(route, overrides = {}) {
  return {
    route_id: route.id,
    name: route.name,
    description: route.description,
    distance: route.distance,
    estimated_time: route.estimatedTime,
    elevation: route.elevation,
    shade: route.shade,
    air_quality: route.airQuality,
    cyclist_type: route.cyclistType,
    review_count: route.reviewCount,
    rating: route.rating,
    start_point: route.startPoint,
    end_point: route.endPoint,
    checkpoints: route.checkpoints.map((checkpoint) => ({
      checkpoint_id: checkpoint.id,
      checkpoint_name: checkpoint.name,
      description: checkpoint.description,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
    })),
    points_of_interest_visited: route.pointsOfInterestVisited ?? [],
    ...overrides,
  }
}

function routeDimensionScore(route, dimension, heritageLookup) {
  if (!route) return 0

  if (dimension === 'shade') {
    if (typeof route.shade === 'number') return route.shade
    return route.shade === 'reduce-shade' ? 86 : 28
  }

  if (dimension === 'difficulty') {
    if (typeof route.elevation === 'number') {
      return Math.min(100, round((route.elevation / 320) * 100))
    }

    if (route.elevation === 'higher') return 88
    if (route.elevation === 'lower') return 32
    return 55
  }

  if (dimension === 'weather') {
    const weatherScore = readNumber(route, ['weather_score'])
    if (weatherScore != null) return weatherScore
    if (typeof route.airQuality === 'number') return route.airQuality
    return route.airQuality === 'care' ? 82 : 40
  }

  const explicitHeritage = readNumber(route, ['heritage_score', 'cultural_score'])
  if (explicitHeritage != null) return explicitHeritage

  const checkpointIds = (route.checkpoints ?? []).map((checkpoint) =>
    String(checkpoint.id ?? checkpoint.checkpoint_id ?? ''),
  )
  const checkpointNames = (route.checkpoints ?? []).map((checkpoint) =>
    String(checkpoint.name ?? checkpoint.checkpoint_name ?? '').toLowerCase(),
  )
  const poiNames = (route.pointsOfInterest ?? []).map((poi) =>
    String(poi.name ?? poi).toLowerCase(),
  )

  const hasHistoricWaypoint = checkpointIds.some((id) => heritageLookup.ids.has(id))
    || checkpointNames.some((name) => heritageLookup.names.has(name))
    || poiNames.some((name) => heritageLookup.names.has(name))
    || checkpointNames.some((name) => /heritage|historic|museum|castle|library/.test(name))
    || poiNames.some((name) => /heritage|historic|museum|castle|library/.test(name))

  return hasHistoricWaypoint ? 90 : 24
}

function dominantDimensionForRoute(route, heritageLookup) {
  const scores = DIMENSIONS.map((dimension) => ({
    dimension,
    score: routeDimensionScore(route, dimension, heritageLookup),
  }))

  scores.sort((left, right) => right.score - left.score)
  return scores[0]?.dimension ?? null
}

function normalizeRouteRecord(record) {
  return {
    id: String(firstDefined(record, ['route_id', 'id']) ?? ''),
    name: readString(record, ['name', 'route_name']) ?? 'Untitled route',
    description: readString(record, ['description']) ?? '',
    shade: firstDefined(record, ['shade', 'shade_pct']) ?? 'dont-care',
    elevation: firstDefined(record, ['elevation', 'elevation_m']) ?? 'dont-care',
    airQuality: firstDefined(record, ['weather_score', 'weather', 'air_quality', 'air_quality_index']) ?? 'dont-care',
    rating: readNumber(record, ['rating']) ?? 0,
    satisfaction: readNumber(record, ['satisfaction_score', 'satisfaction', 'score', 'route_score']),
    checkpoints: (extractArray(record?.checkpoints) || []).map((checkpoint) => ({
      id: String(firstDefined(checkpoint, ['checkpoint_id', 'id']) ?? ''),
      name: readString(checkpoint, ['checkpoint_name', 'name']) ?? 'Checkpoint',
      description: readString(checkpoint, ['description']) ?? '',
      lat: readNumber(checkpoint, ['lat', 'latitude']) ?? 0,
      lng: readNumber(checkpoint, ['lng', 'longitude']) ?? 0,
    })),
    pointsOfInterest: (extractArray(record?.points_of_interest_visited)
      || extractArray(record?.points_of_interest)
      || extractArray(record?.visited_points_of_interest)
      || []
    ).map((poi) =>
      typeof poi === 'string'
        ? { name: poi }
        : {
            id: String(firstDefined(poi, ['id', 'historic_site_id', 'site_id']) ?? ''),
            name: readString(poi, ['name', 'title']) ?? 'POI',
          },
    ),
    createdAt: readDate(record, ['created_at', 'generated_at', 'registered_at']),
    updatedAt: readDate(record, ['updated_at', 'modified_at', 'last_seen_at']),
    raw: record,
  }
}

function normalizeAdminUsers(payload) {
  return extractArray(payload).map((record) => ({
    id: String(firstDefined(record, ['user_id', 'id']) ?? ''),
    email: readString(record, ['email_address', 'email']) ?? '',
    role: readString(record, ['role']) ?? 'user',
    status: readString(record, ['account_status', 'status']) ?? 'Inactive',
    createdAt: readDate(record, ['registered_at', 'created_at', 'joined_at', 'joined_formatted']),
    lastActiveAt: readDate(record, ['last_active', 'last_seen_at', 'updated_at', 'recent_activity_at']),
    raw: record,
  }))
}

function normalizeHistoricSites(payload) {
  const ids = new Set()
  const names = new Set()

  extractArray(payload).forEach((record) => {
    const id = firstDefined(record, ['historic_site_id', 'site_id', 'id'])
    const name = readString(record, ['name', 'title'])

    if (id) ids.add(String(id))
    if (name) names.add(name.toLowerCase())
  })

  return { ids, names }
}

function normalizeParkTimestamp(payload) {
  const timestamps = extractArray(payload)
    .map((record) => readDate(record, ['updated_at', 'modified_at', 'created_at']))
    .filter(Boolean)

  if (!timestamps.length) return null

  timestamps.sort((left, right) => right.getTime() - left.getTime())
  return timestamps[0]
}

function buildScenarioPayload(dimension) {
  return {
    ...TEST_ROUTE_TEMPLATE,
    preferences: {
      cyclist_type: dimension === 'difficulty' ? 'fitness' : 'recreational',
      shade_preference: dimension === 'shade' ? 'reduce-shade' : 'dont-care',
      elevation_preference: dimension === 'difficulty' ? 'higher' : 'dont-care',
      air_quality_preference: dimension === 'weather' ? 'care' : 'dont-care',
      max_distance: dimension === 'difficulty' ? 18 : 15,
      points_of_interest: {
        allow_hawker_center: false,
        allow_park: dimension === 'shade',
        allow_historic_site: dimension === 'heritage',
        allow_tourist_attraction: dimension === 'heritage',
      },
    },
  }
}

function createMockUsers() {
  const now = Date.now()

  return mockAdminUsers.map((user, index) => ({
    user_id: user.id,
    email_address: user.email,
    role: user.role,
    account_status: user.status,
    joined_formatted: user.joinedFormatted,
    created_at: new Date(now - (index + 5) * 8 * DAY_MS).toISOString(),
    last_active: new Date(now - index * 3 * DAY_MS).toISOString(),
  }))
}

function createMockRoutes() {
  const now = Date.now()

  return mockRoutes.map((route, index) =>
    cloneRoute(route, {
      created_at: new Date(now - (index + 1) * 7 * DAY_MS).toISOString(),
      updated_at: new Date(now - index * 36 * 60 * 60 * 1000).toISOString(),
      weather_score: typeof route.airQuality === 'number' ? route.airQuality : 75,
    }),
  )
}

const MOCK_HISTORIC_SITES = [
  { historic_site_id: 'cp3', name: 'Belvedere Castle' },
  { historic_site_id: 'cp5', name: 'Public Library' },
  { historic_site_id: 'cp11', name: 'Conservatory Garden' },
]

function inferMockRequestedDimension(body) {
  const prefs = body?.preferences ?? {}

  if (prefs?.points_of_interest?.allow_historic_site) return 'heritage'
  if (prefs?.shade_preference === 'reduce-shade') return 'shade'
  if (prefs?.elevation_preference === 'higher') return 'difficulty'
  if (prefs?.air_quality_preference === 'care') return 'weather'
  return 'shade'
}

function buildMockRecommendationResponse(body) {
  const heritageLookup = normalizeHistoricSites(MOCK_HISTORIC_SITES)
  const requestedDimension = inferMockRequestedDimension(body)
  const routes = createMockRoutes()
    .map((route) => ({
      route,
      score: routeDimensionScore(normalizeRouteRecord(route), requestedDimension, heritageLookup),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ route, score }) =>
      ({
        ...route,
        satisfaction_score: Math.max(40, Math.min(100, round(score * 0.72 + route.rating * 10))),
        dominant_dimension: requestedDimension,
      }),
    )

  return routes
}

function pickMockResponse(path, init) {
  const { pathname, params } = splitPath(path)

  if (pathname === '/auth/login') {
    const body = init?.body ? JSON.parse(init.body) : {}
    const auth = getMockAuthResult(body.email || 'admin@cyclink.com')
    return {
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
      expires_in: auth.expiresIn,
      user: {
        id: auth.user.id,
        first_name: auth.user.firstName,
        last_name: auth.user.lastName,
        email: auth.user.email,
        onboarding_complete: auth.user.onboardingComplete,
        role: 'admin',
      },
    }
  }

  if (pathname === '/auth/refresh') {
    const auth = getMockAuthResult('admin@cyclink.com')
    return {
      access_token: `mock-access-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_in: auth.expiresIn,
      user: {
        id: auth.user.id,
        first_name: auth.user.firstName,
        last_name: auth.user.lastName,
        email: auth.user.email,
        onboarding_complete: auth.user.onboardingComplete,
        role: 'admin',
      },
    }
  }

  if (pathname === '/admin/stats') {
    return {
      total_users: 582,
      user_count: 582,
      active_users: mockAdminStats.activeUsers,
      total_rides: mockAdminStats.totalRides,
      revenue_formatted: mockAdminStats.revenueFormatted,
      open_reports: mockAdminStats.openReports,
      last_validated_at: new Date(Date.now() - 6 * DAY_MS).toISOString(),
      next_review_date: new Date(Date.now() + 24 * DAY_MS).toISOString(),
    }
  }

  if (pathname === '/admin/users') {
    return createMockUsers()
  }

  if (pathname === '/routes') {
    const page = Number(params.get('page') || '1')
    const limit = Number(params.get('limit') || '50')
    const routes = createMockRoutes()
    const start = (page - 1) * limit
    return routes.slice(start, start + limit)
  }

  if (pathname === '/routes/popular') {
    return createMockRoutes().slice(0, 3)
  }

  if (pathname === '/historic-sites/') {
    return MOCK_HISTORIC_SITES
  }

  if (pathname === '/parks/') {
    return [
      { id: 'park-1', updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
      { id: 'park-2', updated_at: new Date(Date.now() - 41 * 60 * 1000).toISOString() },
    ]
  }

  if (pathname === '/weather/') {
    return { status: 'ok', updated_at: new Date().toISOString() }
  }

  if (pathname === '/routes/recommendations' || pathname === '/route-suggestion/recommend') {
    const body = init?.body ? JSON.parse(init.body) : {}
    return buildMockRecommendationResponse(body)
  }

  throw new Error(`No mock response configured for ${pathname}`)
}

function buildInlineError(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage
}

export default function useAdminStats() {
  const sessionRef = useRef(cachedDashboardSession)
  const credentialsRef = useRef(cachedDashboardCredentials)
  const refreshTimerRef = useRef(0)
  const refreshSessionRef = useRef(null)
  const authPromiseRef = useRef(null)
  const [retryNonce, setRetryNonce] = useState(0)

  const [authState, setAuthState] = useState({
    loading: true,
    error: '',
    source: ADMIN_EMAIL && ADMIN_PASSWORD ? 'environment' : 'prompt',
  })
  const [summaryCards, setSummaryCards] = useState(createEmptySummary)
  const [satisfactionChart, setSatisfactionChart] = useState(() =>
    createChartState(
      'Satisfaction by routing dimension',
      'Average satisfaction_score across dashboard recommendation probes.',
    ),
  )
  const [heritageChart, setHeritageChart] = useState(() =>
    createChartState(
      'Heritage waypoint engagement over time',
      'Routes touching historic waypoints, grouped by activity week.',
    ),
  )
  const [radarChart, setRadarChart] = useState(() =>
    createChartState(
      'Weight config vs satisfaction',
      'Popular routes compared with the full route set across evaluation dimensions.',
    ),
  )
  const [alignmentChart, setAlignmentChart] = useState(() =>
    createChartState(
      'Preference alignment',
      'Top recommendation alignment against each requested evaluation dimension.',
    ),
  )
  const [countdownCard, setCountdownCard] = useState(createMetricState)
  const [dashboardError, setDashboardError] = useState('')
  const [lastLoadedAt, setLastLoadedAt] = useState(null)
  const [recommendationStats, setRecommendationStats] = useState({
    attempts: 0,
    successes: 0,
    lastLatencyMs: null,
  })

  const scheduleRefresh = useCallback((session) => {
    window.clearTimeout(refreshTimerRef.current)

    const refreshIn = Math.max(10_000, session.expiresAt - Date.now() - REFRESH_LEEWAY_MS)
    refreshTimerRef.current = window.setTimeout(() => {
      void refreshSessionRef.current?.()
    }, refreshIn)
  }, [])

  const applySession = useCallback((response, source) => {
    const session = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
      user: response.user ?? null,
    }

    sessionRef.current = session
    cachedDashboardSession = session
    scheduleRefresh(session)
    setAuthState({
      loading: false,
      error: '',
      source,
    })

    return session
  }, [scheduleRefresh])

  const resolveCredentials = useCallback(() => {
    if (credentialsRef.current) {
      return credentialsRef.current
    }

    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      credentialsRef.current = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, source: 'environment' }
      cachedDashboardCredentials = credentialsRef.current
      return credentialsRef.current
    }

    if (USE_MOCKS) {
      credentialsRef.current = {
        email: 'admin@cyclink.com',
        password: 'CycleLink123',
        source: 'mock defaults',
      }
      cachedDashboardCredentials = credentialsRef.current
      return credentialsRef.current
    }

    if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
      throw new Error('Admin credentials are missing. Set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD.')
    }

    const email = window.prompt('Admin email for the evaluation dashboard')?.trim()
    const password = window.prompt('Admin password for the evaluation dashboard')?.trim()

    if (!email || !password) {
      throw new Error('Admin login was cancelled.')
    }

    credentialsRef.current = { email, password, source: 'prompt' }
    cachedDashboardCredentials = credentialsRef.current
    return credentialsRef.current
  }, [])

  const rawRequest = useCallback(async (path, init = {}, options = {}) => {
    const { auth = true, allowRefresh = true } = options

    if (USE_MOCKS) {
      await delay(150)
      return pickMockResponse(path, init)
    }

    const headers = new Headers(init.headers || {})
    let activeSession = sessionRef.current

    if (auth) {
      if (!activeSession) {
        throw new Error('Admin session is unavailable.')
      }

      headers.set('Authorization', `Bearer ${activeSession.accessToken}`)
    }

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers,
    })

    if (response.status === 401 && auth && allowRefresh) {
      await refreshSessionRef.current?.()
      activeSession = sessionRef.current

      const retryHeaders = new Headers(init.headers || {})
      retryHeaders.set('Authorization', `Bearer ${activeSession?.accessToken ?? ''}`)
      if (init.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json')
      }

      return rawRequest(path, { ...init, headers: retryHeaders }, { auth, allowRefresh: false })
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      const error = new Error(errorText || `Request failed with status ${response.status}`)
      error.status = response.status
      throw error
    }

    if (response.status === 204) return null

    return response.json()
  }, [])

  const requestJson = useCallback(async (path, init = {}, options = {}) => {
    const { retry = true, auth = true } = options

    try {
      return await rawRequest(path, init, { auth })
    } catch (error) {
      if (!retry) throw error
      await delay(RETRY_DELAY_MS)
      return rawRequest(path, init, { auth })
    }
  }, [rawRequest])

  const loginSession = useCallback(async () => {
    if (authPromiseRef.current) {
      return authPromiseRef.current
    }

    authPromiseRef.current = (async () => {
      const credentials = resolveCredentials()

      const response = await requestJson(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            remember_me: false,
            client: 'web_app',
          }),
        },
        { auth: false },
      )

      if (response?.user?.role && response.user.role !== 'admin') {
        throw new Error('The provided account does not have admin access.')
      }

      return applySession(response, credentials.source)
    })().finally(() => {
      authPromiseRef.current = null
    })

    return authPromiseRef.current
  }, [applySession, requestJson, resolveCredentials])

  const refreshSession = useCallback(async () => {
    const currentSession = sessionRef.current

    if (!currentSession?.refreshToken) {
      return loginSession()
    }

    try {
      const response = await requestJson(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({
            refresh_token: currentSession.refreshToken,
            client: 'web_app',
          }),
        },
        { auth: false },
      )

      return applySession(response, authState.source)
    } catch {
      return loginSession()
    }
  }, [applySession, authState.source, loginSession, requestJson])

  useEffect(() => {
    refreshSessionRef.current = refreshSession
  }, [refreshSession])

  const ensureSession = useCallback(async () => {
    const session = sessionRef.current

    if (!session) {
      return loginSession()
    }

    if (Date.now() >= session.expiresAt - REFRESH_LEEWAY_MS) {
      return refreshSession()
    }

    scheduleRefresh(session)
    return session
  }, [loginSession, refreshSession, scheduleRefresh])

  const fetchCollection = useCallback(async (path, { pageSize = 50, maxPages = 6 } = {}) => {
    const items = []
    const seen = new Set()

    for (let page = 1; page <= maxPages; page += 1) {
      const separator = path.includes('?') ? '&' : '?'
      let payload

      try {
        payload = await requestJson(`${path}${separator}page=${page}&limit=${pageSize}`)
      } catch (error) {
        if (page === 1) {
          payload = await requestJson(path)
        } else {
          throw error
        }
      }

      const pageItems = extractArray(payload)
      if (!pageItems.length) break

      let added = 0
      pageItems.forEach((item, index) => {
        const candidateKey = firstDefined(item, [
          'route_id',
          'user_id',
          'historic_site_id',
          'site_id',
          'id',
        ])
        const key = candidateKey != null ? String(candidateKey) : `${page}-${index}`

        if (seen.has(key)) return
        seen.add(key)
        items.push(item)
        added += 1
      })

      if (pageItems.length < pageSize || added === 0) break
    }

    return items
  }, [requestJson])

  const runRecommendationScenario = useCallback(async (dimension, heritageLookup) => {
    const payload = buildScenarioPayload(dimension)
    const preferredPath = dimension === 'shade' || dimension === 'heritage'
      ? '/routes/recommendations'
      : '/route-suggestion/recommend'
    const fallbackPath = preferredPath === '/routes/recommendations'
      ? '/route-suggestion/recommend'
      : '/routes/recommendations'

    const startedAt = performance.now()
    let response

    try {
      response = await requestJson(
        preferredPath,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      )
    } catch (error) {
      if (error?.status !== 404 && error?.status !== 405) {
        throw error
      }

      response = await requestJson(
        fallbackPath,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      )
    }

    const latencyMs = round(performance.now() - startedAt)
    const routes = extractArray(response).map(normalizeRouteRecord)
    const validScoredResult = routes.some((route) =>
      route.satisfaction != null || Number.isFinite(route.rating),
    )

    setRecommendationStats((current) => ({
      attempts: current.attempts + 1,
      successes: current.successes + (validScoredResult ? 1 : 0),
      lastLatencyMs: latencyMs,
    }))

    const explicitScores = routes
      .map((route) => route.satisfaction)
      .filter((score) => Number.isFinite(score))
    const averageSatisfaction = explicitScores.length ? round(average(explicitScores)) : null
    const topRoute = routes[0] ?? null
    const alignmentPct = topRoute && dominantDimensionForRoute(topRoute, heritageLookup) === dimension ? 100 : 0

    return {
      key: dimension,
      label: DIMENSION_LABELS[dimension],
      routes,
      averageSatisfaction,
      alignmentPct,
      topRouteName: topRoute?.name ?? 'No result',
    }
  }, [requestJson])

  const measureWeatherProbe = useCallback(async () => {
    const startedAt = performance.now()
    await requestJson('/weather/')
    return performance.now() - startedAt
  }, [requestJson])

  const measurePerformanceSnapshot = useCallback(async () => {
    await ensureSession()

    const latencies = await Promise.all([
      measureWeatherProbe(),
      measureWeatherProbe(),
      measureWeatherProbe(),
    ])
    const parks = await fetchCollection('/parks/')
    const latestParkUpdate = normalizeParkTimestamp(parks)

    return {
      timestamp: new Date().toISOString(),
      pingMs: round(latencies[latencies.length - 1]),
      p50: round(percentile(latencies, 0.5)),
      p95: round(percentile(latencies, 0.95)),
      freshnessLagMs: latestParkUpdate ? Date.now() - latestParkUpdate.getTime() : null,
      latestParkUpdate: latestParkUpdate?.toISOString() ?? null,
    }
  }, [ensureSession, fetchCollection, measureWeatherProbe])

  const latencyPoller = useLatencyPoller({
    enabled: !authState.loading && !authState.error,
    intervalMs: 30000,
    maxSamples: 7,
    measure: measurePerformanceSnapshot,
  })

  const statusItems = useMemo(() => {
    const latestSample = latencyPoller.samples[latencyPoller.samples.length - 1]
    const outputRate = recommendationStats.attempts
      ? percent(recommendationStats.successes, recommendationStats.attempts)
      : 0
    const freshnessMinutes = latestSample?.freshnessLagMs != null
      ? latestSample.freshnessLagMs / (60 * 1000)
      : null

    return [
      {
        label: 'Cluster uptime',
        value: latestSample ? 'Operational' : 'Awaiting probe',
        note: latestSample
          ? `Monitored externally. Last successful ping ${formatShortDuration(latestSample.pingMs)}.`
          : 'No weather ping has completed yet.',
        tone: latestSample ? 'green' : 'amber',
      },
      {
        label: 'API latency',
        value: latestSample ? `P50 ${latestSample.p50} / P95 ${latestSample.p95} ms` : '--',
        note: 'Rolling line chart uses the last seven weather endpoint probe windows.',
        tone: latestSample?.p95 > 900 ? 'amber' : 'green',
      },
      {
        label: 'Data freshness lag',
        value: freshnessMinutes != null ? formatShortDuration(latestSample.freshnessLagMs) : '--',
        note: latestSample?.latestParkUpdate
          ? `Latest park update ${formatFutureDate(new Date(latestSample.latestParkUpdate))}.`
          : 'Park data has not returned an updated_at value yet.',
        tone: freshnessMinutes == null ? 'amber' : freshnessMinutes > 90 ? 'red' : freshnessMinutes > 30 ? 'amber' : 'green',
      },
      {
        label: 'Route generation latency',
        value: recommendationStats.lastLatencyMs != null ? `${recommendationStats.lastLatencyMs} ms` : '--',
        note: 'Last measured POST recommendation round-trip from dashboard evaluation probes.',
        tone: recommendationStats.lastLatencyMs == null
          ? 'amber'
          : recommendationStats.lastLatencyMs > 2000
            ? 'red'
            : recommendationStats.lastLatencyMs > 1200
              ? 'amber'
              : 'green',
      },
      {
        label: 'Scoring output rate',
        value: recommendationStats.attempts ? formatPercent(outputRate) : '--',
        note: recommendationStats.attempts
          ? `${recommendationStats.successes}/${recommendationStats.attempts} evaluation requests returned a scored route.`
          : 'Waiting for recommendation probes.',
        tone: recommendationStats.attempts === 0
          ? 'amber'
          : outputRate < 60
            ? 'red'
            : outputRate < 85
              ? 'amber'
              : 'green',
      },
    ]
  }, [latencyPoller.samples, recommendationStats])

  const latencyChart = useMemo(() => ({
    loading: latencyPoller.loading,
    error: latencyPoller.error,
    title: 'Weather probe latency',
    subtitle: 'P50 and P95 round-trip times from the rolling 30 second poller.',
    labels: latencyPoller.samples.map((sample) =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(sample.timestamp)),
    ),
    datasets: [
      {
        label: 'P50 latency',
        data: latencyPoller.samples.map((sample) => sample.p50),
      },
      {
        label: 'P95 latency',
        data: latencyPoller.samples.map((sample) => sample.p95),
      },
    ],
  }), [latencyPoller.error, latencyPoller.loading, latencyPoller.samples])

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setDashboardError('')
      setAuthState((current) => ({ ...current, loading: true, error: '' }))
      setSummaryCards(createEmptySummary())
      setSatisfactionChart((current) => ({ ...current, loading: true, error: '' }))
      setHeritageChart((current) => ({ ...current, loading: true, error: '' }))
      setRadarChart((current) => ({ ...current, loading: true, error: '' }))
      setAlignmentChart((current) => ({ ...current, loading: true, error: '' }))
      setCountdownCard(createMetricState())

      try {
        await ensureSession()
      } catch (error) {
        if (!active) return

        const message = buildInlineError(error, 'Admin login failed.')
        setAuthState((current) => ({ ...current, loading: false, error: message }))
        setDashboardError(message)
        return
      }

      const [statsResult, usersResult, routesResult, popularRoutesResult, historicSitesResult] = await Promise.all([
        requestJson('/admin/stats').then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error })),
        requestJson('/admin/users').then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error })),
        fetchCollection('/routes').then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error })),
        requestJson('/routes/popular').then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error })),
        fetchCollection('/historic-sites/').then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error })),
      ])

      if (!active) return

      const users = usersResult.ok ? normalizeAdminUsers(usersResult.data) : []
      const statsPayload = statsResult.ok ? statsResult.data : null
      const totalUsers = readNumber(statsPayload, ['total_users', 'user_count']) ?? users.length
      const recentSignups = users.filter((user) =>
        user.createdAt && Date.now() - user.createdAt.getTime() <= 30 * DAY_MS,
      ).length
      const recent7d = users.filter((user) =>
        user.lastActiveAt && Date.now() - user.lastActiveAt.getTime() <= 7 * DAY_MS,
      ).length
      const recent30d = users.filter((user) =>
        user.lastActiveAt && Date.now() - user.lastActiveAt.getTime() <= 30 * DAY_MS,
      ).length

      setSummaryCards({
        totalUsers: totalUsers != null
          ? {
              loading: false,
              error: '',
              value: formatInteger(totalUsers),
              delta: `+${formatInteger(recentSignups)} signups in the last 30 days`,
              tone: 'positive',
            }
          : {
              loading: false,
              error: statsResult.ok || usersResult.ok ? 'No user counts returned.' : 'User totals are unavailable.',
              value: '--',
              delta: 'Awaiting admin counts',
              tone: 'neutral',
            },
        signups30d: usersResult.ok
          ? {
              loading: false,
              error: '',
              value: formatInteger(recentSignups),
              delta: totalUsers ? `${formatPercent(percent(recentSignups, totalUsers))} of the current base` : 'Recent registration volume',
              tone: recentSignups > 0 ? 'positive' : 'neutral',
            }
          : {
              loading: false,
              error: buildInlineError(usersResult.error, 'Could not load users.'),
              value: '--',
              delta: 'No registration timestamps available',
              tone: 'neutral',
            },
        return7d: usersResult.ok
          ? {
              loading: false,
              error: '',
              value: formatPercent(percent(recent7d, totalUsers || users.length)),
              delta: `${formatInteger(recent7d)} of ${formatInteger(totalUsers || users.length)} users active within 7 days`,
              tone: percent(recent7d, totalUsers || users.length) >= 55 ? 'positive' : 'warning',
            }
          : {
              loading: false,
              error: buildInlineError(usersResult.error, 'Could not calculate the 7-day return rate.'),
              value: '--',
              delta: 'Missing activity timestamps',
              tone: 'neutral',
            },
        return30d: usersResult.ok
          ? {
              loading: false,
              error: '',
              value: formatPercent(percent(recent30d, totalUsers || users.length)),
              delta: `${formatInteger(recent30d)} users returned in the last 30 days`,
              tone: percent(recent30d, totalUsers || users.length) >= 70 ? 'positive' : 'warning',
            }
          : {
              loading: false,
              error: buildInlineError(usersResult.error, 'Could not calculate the 30-day return rate.'),
              value: '--',
              delta: 'Missing activity timestamps',
              tone: 'neutral',
            },
      })

      const statsFetchTimestamp = new Date()
      const nextReviewDate = readDate(statsPayload, ['next_review_date'])
      const lastValidatedAt = readDate(statsPayload, ['last_validated_at'])
      const targetReviewDate = nextReviewDate
        || (lastValidatedAt ? new Date(lastValidatedAt.getTime() + 30 * DAY_MS) : new Date(statsFetchTimestamp.getTime() + 30 * DAY_MS))
      const daysRemaining = Math.max(0, Math.ceil((targetReviewDate.getTime() - Date.now()) / DAY_MS))

      setCountdownCard({
        loading: false,
        error: '',
        value: `${daysRemaining} days`,
        delta: `Next review target ${formatFutureDate(targetReviewDate)}`,
        tone: daysRemaining <= 7 ? 'warning' : 'positive',
      })

      const heritageLookup = historicSitesResult.ok
        ? normalizeHistoricSites(historicSitesResult.data)
        : normalizeHistoricSites(MOCK_HISTORIC_SITES)
      const allRoutes = routesResult.ok ? routesResult.data.map(normalizeRouteRecord) : []
      const popularRoutes = popularRoutesResult.ok
        ? extractArray(popularRoutesResult.data).map(normalizeRouteRecord)
        : []

      const scenarioResults = await Promise.all(
        DIMENSIONS.map((dimension) =>
          runRecommendationScenario(dimension, heritageLookup)
            .then((data) => ({ ok: true, data }))
            .catch((error) => ({ ok: false, error, key: dimension })),
        ),
      )

      if (!active) return

      const successfulScenarioResults = scenarioResults
        .filter((result) => result.ok)
        .map((result) => result.data)

      const satisfactionValues = successfulScenarioResults
        .map((scenario) => scenario.averageSatisfaction)
        .filter((value) => Number.isFinite(value))

      if (satisfactionValues.length) {
        setSatisfactionChart({
          loading: false,
          error: '',
          title: 'Satisfaction by routing dimension',
          subtitle: 'Average satisfaction_score across recent dashboard recommendation probes.',
          labels: successfulScenarioResults.map((scenario) => scenario.label),
          datasets: [
            {
              label: 'Avg satisfaction',
              data: successfulScenarioResults.map((scenario) => scenario.averageSatisfaction ?? 0),
            },
          ],
        })
      } else {
        setSatisfactionChart({
          loading: false,
          error: '',
          title: 'Satisfaction by routing dimension',
          subtitle: 'No satisfaction_score fields returned yet. Showing placeholders until live scoring arrives.',
          labels: DIMENSIONS.map((dimension) => DIMENSION_LABELS[dimension]),
          datasets: [
            {
              label: 'No data',
              data: DIMENSIONS.map(() => 0),
            },
          ],
        })
      }

      if (routesResult.ok) {
        const weeklyCounts = new Map()

        allRoutes.forEach((route) => {
          const timestamp = route.createdAt ?? route.updatedAt
          if (!timestamp) return

          const hasHistoricWaypoint = route.checkpoints.some((checkpoint) => heritageLookup.ids.has(checkpoint.id))
            || route.checkpoints.some((checkpoint) => heritageLookup.names.has(checkpoint.name.toLowerCase()))

          if (!hasHistoricWaypoint) return

          const key = startOfWeek(timestamp).toISOString()
          weeklyCounts.set(key, (weeklyCounts.get(key) ?? 0) + 1)
        })

        const sortedEntries = [...weeklyCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]))

        setHeritageChart({
          loading: false,
          error: '',
          title: 'Heritage waypoint engagement over time',
          subtitle: 'Routes containing historic-site checkpoints grouped by activity week.',
          labels: sortedEntries.map(([week]) => formatWeekLabel(new Date(week))),
          datasets: [
            {
              label: 'Historic routes',
              data: sortedEntries.map(([, count]) => count),
            },
          ],
        })
      } else {
        setHeritageChart({
          loading: false,
          error: buildInlineError(routesResult.error, 'Routes are unavailable.'),
          title: 'Heritage waypoint engagement over time',
          subtitle: 'Routes containing historic-site checkpoints grouped by activity week.',
          labels: [],
          datasets: [],
        })
      }

      const scenarioScoreMap = new Map()
      successfulScenarioResults.forEach((scenario) => {
        scenario.routes.forEach((route) => {
          const routeScores = scenarioScoreMap.get(route.id) ?? {}
          routeScores[scenario.key] = route.satisfaction ?? routeDimensionScore(route, scenario.key, heritageLookup)
          scenarioScoreMap.set(route.id, routeScores)
        })
      })

      const buildRadarValues = (routes) =>
        DIMENSIONS.map((dimension) => {
          if (!routes.length) return 0

          return round(average(routes.map((route) => {
            const scenarioScores = scenarioScoreMap.get(route.id)
            if (scenarioScores?.[dimension] != null) {
              return scenarioScores[dimension]
            }

            return routeDimensionScore(route, dimension, heritageLookup)
          })))
        })

      setRadarChart({
        loading: false,
        error: !allRoutes.length && !popularRoutes.length
          ? 'Route quality inputs are unavailable.'
          : '',
        title: 'Weight config vs satisfaction',
        subtitle: 'Popular routes vs all routes across shade, heritage, difficulty, and weather.',
        labels: DIMENSIONS.map((dimension) => DIMENSION_LABELS[dimension]),
        datasets: [
          { label: 'Popular routes', data: buildRadarValues(popularRoutes) },
          { label: 'All routes', data: buildRadarValues(allRoutes) },
        ],
      })

      setAlignmentChart({
        loading: false,
        error: successfulScenarioResults.length ? '' : 'No recommendation probes completed.',
        title: 'Preference alignment',
        subtitle: 'Percent of top recommendations whose strongest dimension matched the requested preference.',
        labels: DIMENSIONS.map((dimension) => DIMENSION_LABELS[dimension]),
        datasets: [
          {
            label: 'Alignment',
            data: DIMENSIONS.map((dimension) =>
              successfulScenarioResults.find((scenario) => scenario.key === dimension)?.alignmentPct ?? 0,
            ),
          },
        ],
      })

      setLastLoadedAt(new Date().toISOString())

      if (!statsResult.ok && !usersResult.ok && !routesResult.ok && !popularRoutesResult.ok) {
        setDashboardError('Admin data loaded partially. Some cards are using fallbacks or placeholders.')
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [ensureSession, fetchCollection, requestJson, retryNonce, runRecommendationScenario])

  useEffect(() => () => {
    window.clearTimeout(refreshTimerRef.current)
  }, [])

  const retryAuth = useCallback(() => {
    if (!(ADMIN_EMAIL && ADMIN_PASSWORD)) {
      credentialsRef.current = null
      cachedDashboardCredentials = null
    }

    sessionRef.current = null
    cachedDashboardSession = null
    window.clearTimeout(refreshTimerRef.current)
    setRecommendationStats({
      attempts: 0,
      successes: 0,
      lastLatencyMs: null,
    })
    setRetryNonce((current) => current + 1)
  }, [])

  const effectiveLastUpdatedAt = latencyPoller.lastSuccessfulAt ?? lastLoadedAt

  return {
    authState,
    summaryCards,
    satisfactionChart,
    heritageChart,
    latencyChart,
    radarChart,
    alignmentChart,
    countdownCard,
    dashboardError,
    lastUpdatedAt: effectiveLastUpdatedAt,
    statusPanel: {
      loading: latencyPoller.loading,
      error: latencyPoller.error,
      items: statusItems,
    },
    retryAuth,
  }
}
