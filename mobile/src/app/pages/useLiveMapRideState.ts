import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Route } from '../../../../shared/types/index';
import {
  type ActiveRideSession,
  advanceActiveRideSession,
  loadActiveRideSession,
  pauseActiveRideSession,
  resumeActiveRideSession,
  saveActiveRideSession,
} from '../../services/activeRideSession';
import {
  clearRideSessionAndStopTracking,
  ensureBackgroundRideTrackingStarted,
  stopBackgroundRideTracking,
} from '../../services/backgroundRideTracking';
import { LIVE_MAP_PROGRESS_SIMULATION } from '../../config/runtime';
import { resolveRouteById } from '../../services/routeLookup';
import { saveRide } from '../../services/rideService';
import {
  clearRideNotifications,
  ensureRideNotificationPermission,
  scheduleSimulationProgressNotifications,
  notifyCheckpointReachedInBackground,
  notifyRidePaused,
  notifyRideResumed,
  notifyRideTrackingInBackground,
} from '../../services/rideNotifications';
import {
  boundsFromCoordinates,
  haversineDistanceKm,
  interpolateAlongRoute,
  projectPointOntoRoute,
  routeToLineCoordinates,
  type LngLat,
} from '@/utils/routeGeometry';

const OFF_ROUTE_WARNING_METERS = 80;
const ENDPOINT_COMPLETION_RADIUS_KM = 0.04;
const MIN_COMPLETION_MOVEMENT_KM = 0.02;

type TrackingState = {
  position: LngLat | null;
  rawPosition: LngLat | null;
  distanceKm: number;
  progressPct: number;
};

type LocationIssue = 'services-disabled' | 'signal-unavailable';

const EMPTY_TRACKING: TrackingState = {
  position: null,
  rawPosition: null,
  distanceKm: 0,
  progressPct: 0,
};

export function useLiveMapRideState(routeId: string | undefined, initialRoute?: Route | null) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [route, setRoute] = useState<Route | null>(initialRoute ?? null);
  const [routeLoading, setRouteLoading] = useState(!initialRoute);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [sessionPausedAt, setSessionPausedAt] = useState<string | null>(null);
  const [sessionCompletedAt, setSessionCompletedAt] = useState<string | null>(null);
  const [pausedDurationMs, setPausedDurationMs] = useState(0);
  const [tracking, setTracking] = useState<TrackingState>(EMPTY_TRACKING);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [checkpointBanner, setCheckpointBanner] = useState<string | null>(null);
  const [visitedPoiIndices, setVisitedPoiIndices] = useState<Set<number>>(new Set());
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
  const [metersFromRoute, setMetersFromRoute] = useState<number | null>(null);
  const persistRidePromiseRef = useRef<Promise<void> | null>(null);
  const initializedSessionRouteIdRef = useRef<string | undefined>(undefined);
  const previousCheckpointRef = useRef(0);
  const completionModalShownRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const simulationStatusRef = useRef({ progressPct: 0, elapsedSec: 0 });
  const rideSummaryRef = useRef<{ distanceKm: number; elapsedMinutes: number; checkpointsVisited: number }>({ distanceKm: 0, elapsedMinutes: 0, checkpointsVisited: 0 });

  const hydrateTrackingFromSession = useCallback(async () => {
    if (!routeId) {
      return null;
    }

    const session = await loadActiveRideSession();
    if (!session || session.routeId !== routeId) {
      return null;
    }

    setSessionStartedAt(session.startedAt);
    setSessionPausedAt(session.status === 'paused' ? session.pausedAt ?? session.startedAt : null);
    setPausedDurationMs(session.totalPausedMs ?? 0);
    setTracking({
      position: session.lastKnownPosition
        ? [session.lastKnownPosition.lng, session.lastKnownPosition.lat]
        : null,
      rawPosition: session.lastKnownPosition
        ? [session.lastKnownPosition.lng, session.lastKnownPosition.lat]
        : null,
      distanceKm: session.distanceKm ?? 0,
      progressPct: session.progressPct ?? 0,
    });
    setLocationReady(Boolean(session.lastKnownPosition));
    setLocationDenied(false);
    setLocationIssue(null);

    return session;
  }, [routeId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!routeId) {
        if (!cancelled) {
          setRoute(initialRoute ?? null);
          setRouteLoading(false);
        }
        return;
      }

      if (!initialRoute) {
        setRouteLoading(true);
      }

      const resolved = await resolveRouteById(routeId);
      if (!cancelled) {
        setRoute(resolved ?? initialRoute ?? null);
        setRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialRoute, routeId]);

  useEffect(() => {
    setSessionReady(false);
    setSessionStartedAt(null);
    setSessionPausedAt(null);
    setSessionCompletedAt(null);
    setPausedDurationMs(0);
    setTracking(EMPTY_TRACKING);
    setCheckpointBanner(null);
    setShowExitModal(false);
    setShowCompletionModal(false);
    setLocationReady(false);
    setLocationDenied(false);
    setLocationIssue(null);
    setMetersFromRoute(null);
    initializedSessionRouteIdRef.current = undefined;
    persistRidePromiseRef.current = null;
    previousCheckpointRef.current = 0;
    completionModalShownRef.current = false;
  }, [routeId]);

  const simulationScheduledRef = useRef(false);

  useEffect(() => {
    simulationScheduledRef.current = false;
  }, [route, sessionReady]);

  useEffect(() => {
    const updateNow = () => setNowMs(Date.now());
    const id = setInterval(updateNow, 1000);
    const sub = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active') {
        updateNow();
        simulationScheduledRef.current = false;
        void clearRideNotifications().catch(() => {});
        // Re-schedule from current progress when user returns to foreground,
        // then clear again once they're back (they'll see the UI instead).
        void hydrateTrackingFromSession();
      }

      // For non-simulation: fire a "tracking active" banner when going to background.
      // Simulation notifications are pre-scheduled at ride start (see bootstrapSession).
      const goingToBackground =
        (previousState === 'active' || previousState === 'inactive') &&
        (nextState === 'background' || nextState === 'inactive');

      if (
        goingToBackground &&
        !simulationScheduledRef.current &&
        route &&
        sessionReady &&
        !sessionPausedAt &&
        !sessionCompletedAt
      ) {
        simulationScheduledRef.current = true;
        if (LIVE_MAP_PROGRESS_SIMULATION) {
          // Re-schedule from current progress — foreground return cleared the previous
          // batch, so we need a fresh set before the app suspends again.
          void clearRideNotifications()
            .catch(() => {})
            .then(() =>
              scheduleSimulationProgressNotifications(
                route,
                simulationStatusRef.current.progressPct,
                simulationStatusRef.current.elapsedSec,
              ),
            )
            .catch(() => {});
        } else {
          void notifyRideTrackingInBackground(route.name).catch(() => {});
        }
      }
    });
    updateNow();

    return () => {
      clearInterval(id);
      sub?.remove?.();
    };
  }, [
    hydrateTrackingFromSession,
    route,
    sessionCompletedAt,
    sessionPausedAt,
    sessionReady,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      if (!routeId || !route) {
        if (!cancelled) {
          setSessionReady(true);
        }
        return;
      }

      if (route.id !== routeId) {
        return;
      }

      if (initializedSessionRouteIdRef.current === routeId) {
        if (!cancelled) {
          setSessionReady(true);
        }
        return;
      }

      initializedSessionRouteIdRef.current = routeId;
      const activeSession = await hydrateTrackingFromSession();
      if (cancelled) {
        return;
      }

      if (activeSession?.routeId === routeId) {
        if (!initialRoute) {
          setRoute(activeSession.route);
        }
        setSessionReady(true);
        void ensureRideNotificationPermission()
          .then(() => {
            if (LIVE_MAP_PROGRESS_SIMULATION) {
              return clearRideNotifications()
                .catch(() => {})
                .then(() =>
                  scheduleSimulationProgressNotifications(
                    activeSession.route,
                    activeSession.progressPct ?? 0,
                    0,
                  ),
                )
                .catch(() => {});
            }
            return Promise.resolve();
          })
          .catch(() => {});
        return;
      }

      const startedAt = new Date().toISOString();
      setSessionStartedAt(startedAt);
      setSessionPausedAt(null);
      setPausedDurationMs(0);
      setTracking(EMPTY_TRACKING);
      setSessionReady(true);
      await saveActiveRideSession({
        version: 1,
        routeId,
        route,
        startedAt,
      });
      void ensureRideNotificationPermission()
        .then(() => {
          if (LIVE_MAP_PROGRESS_SIMULATION) {
            // Pre-schedule all simulation notifications NOW while the app is foregrounded.
            // iOS may suspend JS before background-transition async chains complete,
            // so we schedule eagerly here instead of waiting for the AppState change.
            return clearRideNotifications()
              .catch(() => {})
              .then(() => scheduleSimulationProgressNotifications(route, 0, 0))
              .catch(() => {});
          }
          return Promise.resolve();
        })
        .catch(() => {});
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [hydrateTrackingFromSession, initialRoute, route, routeId]);

  const lineCoords = useMemo(() => (route ? routeToLineCoordinates(route) : []), [route]);
  const isPaused = sessionPausedAt !== null;
  const isRideFinished = sessionCompletedAt !== null;

  const buildSession = useCallback(
    (overrides: Partial<ActiveRideSession> = {}): ActiveRideSession | null => {
      if (!routeId || !route || !sessionStartedAt) {
        return null;
      }

      return {
        version: 1,
        routeId,
        route,
        startedAt: sessionStartedAt,
        status: sessionPausedAt ? 'paused' : 'active',
        pausedAt: sessionPausedAt ?? undefined,
        totalPausedMs: pausedDurationMs,
        lastKnownPosition: tracking.position
          ? { lat: tracking.position[1], lng: tracking.position[0] }
          : undefined,
        distanceKm: tracking.distanceKm,
        progressPct: tracking.progressPct,
        ...overrides,
      };
    },
    [pausedDurationMs, route, routeId, sessionPausedAt, sessionStartedAt, tracking],
  );

  const applyTrackedPosition = useCallback(
    (nextPosition: LngLat, accuracyMeters?: number | null) => {
      if (!route || !routeId || !sessionStartedAt || isPaused || isRideFinished) {
        return;
      }

      setLocationReady(true);
      setLocationDenied(false);
      setLocationIssue(null);

      setTracking((prev) => {
        const nextSession = advanceActiveRideSession(
          {
            version: 1,
            routeId,
            route,
            startedAt: sessionStartedAt,
            status: 'active',
            totalPausedMs: pausedDurationMs,
            lastKnownPosition: prev.position
              ? { lat: prev.position[1], lng: prev.position[0] }
              : undefined,
            distanceKm: prev.distanceKm,
            progressPct: prev.progressPct,
          },
          { lat: nextPosition[1], lng: nextPosition[0] },
          accuracyMeters,
        );

        return {
          position: nextSession.lastKnownPosition
            ? [nextSession.lastKnownPosition.lng, nextSession.lastKnownPosition.lat]
            : null,
          rawPosition: nextPosition,
          distanceKm: nextSession.distanceKm ?? 0,
          progressPct: nextSession.progressPct ?? 0,
        };
      });
    },
    [isPaused, isRideFinished, pausedDurationMs, route, routeId, sessionStartedAt]
  );

  useEffect(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION || !sessionReady || !route || !routeId || isPaused || isRideFinished) {
      return undefined;
    }

    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    function setLocationUnavailable(issue: LocationIssue) {
      setLocationReady(true);
      setLocationDenied(false);
      setLocationIssue(issue);
    }

    async function getCurrentPositionWithTimeout(timeoutMs: number) {
      return await new Promise<Location.LocationObject>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Timed out while waiting for a location fix.')),
          timeoutMs,
        );

        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
          .then((position) => {
            clearTimeout(timer);
            resolve(position);
          })
          .catch((error) => {
            clearTimeout(timer);
            reject(error);
          });
      });
    }

    async function startWatching() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) {
          return;
        }

        if (permission.status !== 'granted') {
          setLocationDenied(true);
          setLocationReady(true);
          setLocationIssue(null);
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!active) {
          return;
        }

        if (!servicesEnabled) {
          setLocationUnavailable('services-disabled');
          return;
        }

        const lastKnownPosition = await Location.getLastKnownPositionAsync({
          maxAge: 60_000,
          requiredAccuracy: 100,
        });

        if (!active) {
          return;
        }

        if (lastKnownPosition) {
          applyTrackedPosition(
            [lastKnownPosition.coords.longitude, lastKnownPosition.coords.latitude],
            lastKnownPosition.coords.accuracy,
          );
        }

        try {
          const initialPosition = await getCurrentPositionWithTimeout(10_000);
          if (!active) {
            return;
          }

          applyTrackedPosition(
            [initialPosition.coords.longitude, initialPosition.coords.latitude],
            initialPosition.coords.accuracy,
          );
        } catch {
          if (!lastKnownPosition) {
            setLocationUnavailable('signal-unavailable');
          }
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (update) => {
            applyTrackedPosition(
              [update.coords.longitude, update.coords.latitude],
              update.coords.accuracy,
            );
          },
        );
      } catch {
        if (!active) {
          return;
        }
        setLocationUnavailable('signal-unavailable');
      }
    }

    void startWatching();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [applyTrackedPosition, isPaused, isRideFinished, route, routeId, sessionReady]);

  useEffect(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION || !sessionReady || !route || !routeId || isPaused || isRideFinished) {
      return;
    }

    void ensureBackgroundRideTrackingStarted().catch((error) => {
      console.warn('[BackgroundRideTracking] Failed to start background tracking', error);
    });
  }, [isPaused, isRideFinished, route, routeId, sessionReady]);

  useEffect(() => {
    if (!routeId || !route || !sessionStartedAt || !sessionReady || isRideFinished) {
      return;
    }

    const session = buildSession();
    if (!session) {
      return;
    }

    void saveActiveRideSession(session);
  }, [buildSession, isRideFinished, routeId, route, sessionReady, sessionStartedAt]);

  const elapsedSec = useMemo(() => {
    if (!sessionStartedAt) {
      return 0;
    }

    const startedAtMs = Date.parse(sessionStartedAt);
    if (Number.isNaN(startedAtMs)) {
      return 0;
    }

    const referenceMs = sessionCompletedAt
      ? Date.parse(sessionCompletedAt)
      : sessionPausedAt
        ? Date.parse(sessionPausedAt)
        : nowMs;
    const safeReferenceMs = Number.isNaN(referenceMs) ? nowMs : referenceMs;

    return Math.max(0, Math.floor((safeReferenceMs - startedAtMs - pausedDurationMs) / 1000));
  }, [nowMs, pausedDurationMs, sessionCompletedAt, sessionPausedAt, sessionStartedAt]);

  const simulatedProgressPct = useMemo(
    () => Math.min(100, elapsedSec * 2),
    [elapsedSec]
  );

  const progressPct = LIVE_MAP_PROGRESS_SIMULATION
    ? simulatedProgressPct
    : tracking.progressPct;

  useEffect(() => {
    simulationStatusRef.current = {
      progressPct,
      elapsedSec,
    };
  }, [elapsedSec, progressPct]);

  const riderPosition = useMemo<LngLat>(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION) {
      return lineCoords.length ? interpolateAlongRoute(lineCoords, progressPct / 100) : [0, 0];
    }

    return tracking.position ?? lineCoords[0] ?? [0, 0];
  }, [lineCoords, progressPct, tracking.position]);

  useEffect(() => {
    const positionForDistance = tracking.rawPosition ?? tracking.position;
    if (!positionForDistance || lineCoords.length < 2) {
      setMetersFromRoute(null);
      return;
    }

    const { distanceKmFromRoute } = projectPointOntoRoute(lineCoords, positionForDistance);
    setMetersFromRoute(Number.isFinite(distanceKmFromRoute) ? distanceKmFromRoute * 1000 : null);
  }, [lineCoords, tracking.position, tracking.rawPosition]);

  const lineFeature = useMemo(
    (): {
      type: 'Feature';
      properties: Record<string, never>;
      geometry: { type: 'LineString'; coordinates: LngLat[] };
    } => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: lineCoords },
    }),
    [lineCoords]
  );

  const bounds = useMemo(() => boundsFromCoordinates(lineCoords), [lineCoords]);

  const riderPoint = useMemo(
    (): {
      type: 'Feature';
      properties: Record<string, never>;
      geometry: { type: 'Point'; coordinates: LngLat };
    } => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Point' as const, coordinates: riderPosition },
    }),
    [riderPosition]
  );

  const riderLngLat = useMemo<LngLat | null>(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION) {
      return lineCoords.length ? riderPosition : null;
    }

    return tracking.rawPosition ?? tracking.position;
  }, [lineCoords.length, riderPosition, tracking.position, tracking.rawPosition]);

  const riderHasFix = LIVE_MAP_PROGRESS_SIMULATION
    ? lineCoords.length > 0
    : Boolean(tracking.rawPosition ?? tracking.position);

  const completionReferencePosition = tracking.rawPosition ?? tracking.position;

  const distanceToEndKm = useMemo(() => {
    if (!route || !completionReferencePosition) {
      return Number.POSITIVE_INFINITY;
    }

    return haversineDistanceKm(completionReferencePosition, [route.endPoint.lng, route.endPoint.lat]);
  }, [completionReferencePosition, route]);

  const distanceFromStartKm = useMemo(() => {
    if (!route || !completionReferencePosition) {
      return 0;
    }

    return haversineDistanceKm(completionReferencePosition, [route.startPoint.lng, route.startPoint.lat]);
  }, [completionReferencePosition, route]);

  const completionMovementThresholdKm = useMemo(() => {
    if (!route) {
      return MIN_COMPLETION_MOVEMENT_KM;
    }

    return Math.min(0.05, Math.max(route.distance * 0.1, MIN_COMPLETION_MOVEMENT_KM));
  }, [route]);

  const endpointCompletionEligible =
    !LIVE_MAP_PROGRESS_SIMULATION &&
    Boolean(route) &&
    Boolean(completionReferencePosition) &&
    distanceToEndKm <= ENDPOINT_COMPLETION_RADIUS_KM &&
    (distanceFromStartKm >= completionMovementThresholdKm ||
      tracking.distanceKm >= completionMovementThresholdKm);

  const routeCompleted = LIVE_MAP_PROGRESS_SIMULATION
    ? progressPct >= 99
    : progressPct >= 98 || endpointCompletionEligible;

  const displayProgressPct =
    routeCompleted && !LIVE_MAP_PROGRESS_SIMULATION ? 100 : progressPct;

  useEffect(() => {
    if (!routeCompleted || completionModalShownRef.current) {
      return;
    }

    completionModalShownRef.current = true;
    const completedAt = new Date().toISOString();
    setSessionCompletedAt(completedAt);
    setSessionPausedAt(null);
    setShowCompletionModal(true);

    // In simulation mode the completion notification is already pre-scheduled at ride
    // start via scheduleSimulationProgressNotifications — no need to schedule again here.
    // In real GPS mode the background task sends notifyRideCompletedInBackground directly.

    // Do NOT call clearRideNotifications() here — it would cancel the completion
    // notification that was just scheduled (or pre-scheduled at ride start) before
    // it has a chance to fire. Notifications are cleared in finalizeCompletedRide
    // and abandonIncompleteRide, after the user interacts with the completion modal.
    void clearRideSessionAndStopTracking().catch((error) => {
      console.warn('[LiveMap] Failed to finalize completed ride session', error);
    });
  }, [route, routeCompleted]);

  const currentCheckpoint = useMemo(() => {
    if (!route || !route.checkpoints.length) {
      return 0;
    }

    const threshold = 100 / (route.checkpoints.length + 1);
    return Math.min(route.checkpoints.length, Math.floor(displayProgressPct / threshold));
  }, [displayProgressPct, route]);

  useEffect(() => {
    if (!route || !lineCoords.length) {
      previousCheckpointRef.current = 0;
      return undefined;
    }

    if (currentCheckpoint > previousCheckpointRef.current) {
      const checkpoint = route.checkpoints[currentCheckpoint - 1];
      if (checkpoint) {
        setCheckpointBanner(`${checkpoint.name} - ${checkpoint.description}`);
        if (LIVE_MAP_PROGRESS_SIMULATION) {
          void notifyCheckpointReachedInBackground(route.name, checkpoint.name).catch(() => {});
        }
        const timer = setTimeout(() => setCheckpointBanner(null), 3000);
        previousCheckpointRef.current = currentCheckpoint;
        return () => clearTimeout(timer);
      }
    }

    previousCheckpointRef.current = currentCheckpoint;
    return undefined;
  }, [currentCheckpoint, lineCoords.length, route]);

  useEffect(() => {
    const poiDetectionLngLat = riderLngLat ?? tracking.rawPosition;
    if (!poiDetectionLngLat || !route?.pointsOfInterestVisited?.length) return;

    const pois = route.pointsOfInterestVisited;
    setVisitedPoiIndices((prev) => {
      const next = new Set(prev);
      let anyNew = false;
      pois.forEach((poi, i) => {
        if (next.has(i)) return;
        if (typeof poi.lat !== 'number' || typeof poi.lng !== 'number') return;
        const distKm = haversineDistanceKm(poiDetectionLngLat, [poi.lng, poi.lat]);
        if (distKm <= 0.08) {
          next.add(i);
          anyNew = true;
        }
      });
      return anyNew ? next : prev;
    });
  }, [riderLngLat, route, tracking.rawPosition]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const distanceTraveled = route
    ? (
        LIVE_MAP_PROGRESS_SIMULATION
          ? (route.distance * progressPct) / 100
          : tracking.distanceKm
      ).toFixed(2)
    : '0.00';

  const rideSummary = useMemo(
    () => ({
      distanceKm: routeCompleted && route ? route.distance : Number(distanceTraveled),
      elapsedMinutes: Math.max(1, Math.round(elapsedSec / 60)),
      checkpointsVisited: routeCompleted && route ? route.checkpoints.length : currentCheckpoint,
    }),
    [currentCheckpoint, distanceTraveled, elapsedSec, route, routeCompleted],
  );

  useEffect(() => {
    rideSummaryRef.current = rideSummary;
  }, [rideSummary]);

  const checkpointsVisitedCount = useMemo(() => {
    if (!route) {
      return 0;
    }

    return Math.min(route.checkpoints.length, currentCheckpoint);
  }, [currentCheckpoint, route]);

  const offRouteWarning = useMemo(() => {
    if (metersFromRoute == null || !Number.isFinite(metersFromRoute)) {
      return false;
    }

    return metersFromRoute > OFF_ROUTE_WARNING_METERS;
  }, [metersFromRoute]);

  const persistRideCompletion = useCallback(async () => {
    if (!route || !routeId || !routeCompleted) {
      return;
    }

    if (!persistRidePromiseRef.current) {
      const safeDistance = Number.isFinite(rideSummary.distanceKm) ? rideSummary.distanceKm : 0;
      const avgSpeed = elapsedSec > 0 ? Number((safeDistance / (elapsedSec / 3600)).toFixed(1)) : 0;

      persistRidePromiseRef.current = saveRide({
        route,
        startTime: sessionStartedAt ?? new Date(nowMs).toISOString(),
        endTime: new Date().toISOString(),
        distance: safeDistance,
        avgSpeed,
        checkpointsVisited: rideSummary.checkpointsVisited,
        pointsOfInterestVisited: route.pointsOfInterestVisited,
      })
        .then(() => {})
        .catch((error) => {
          console.warn('[LiveMap] Failed to persist completed ride', error);
        });
    }

    await persistRidePromiseRef.current;
  }, [
    elapsedSec,
    nowMs,
    route,
    routeCompleted,
    routeId,
    rideSummary,
    sessionStartedAt,
  ]);

  const pauseRide = useCallback(() => {
    const run = async () => {
      const pausedAt = new Date().toISOString();
      const nextSession = buildSession();
      if (!nextSession || !route || isRideFinished) {
        return;
      }

      const pausedSession = pauseActiveRideSession(nextSession, pausedAt);
      setSessionPausedAt(pausedAt);
      await saveActiveRideSession(pausedSession);
      await stopBackgroundRideTracking();
      await notifyRidePaused(route.name).catch(() => {});
    };

    void run();
  }, [buildSession, isRideFinished, route]);

  const resumeRide = useCallback(() => {
    const run = async () => {
      const resumedAt = new Date().toISOString();
      const currentSession = buildSession();
      if (!currentSession || !route || isRideFinished) {
        return;
      }

      const resumedSession = resumeActiveRideSession(currentSession, resumedAt);
      setSessionPausedAt(null);
      setPausedDurationMs(resumedSession.totalPausedMs ?? 0);
      await saveActiveRideSession(resumedSession);
      await ensureBackgroundRideTrackingStarted().catch((error) => {
        console.warn('[BackgroundRideTracking] Failed to resume background tracking', error);
      });
      await notifyRideResumed(route.name).catch(() => {});
      await clearRideNotifications().catch(() => {});

      // Re-schedule simulation notifications from current position after resume.
      if (LIVE_MAP_PROGRESS_SIMULATION) {
        void scheduleSimulationProgressNotifications(
          route,
          simulationStatusRef.current.progressPct,
          simulationStatusRef.current.elapsedSec,
        ).catch(() => {});
      }
    };

    void run();
  }, [buildSession, isRideFinished, route]);

  const finalizeCompletedRide = useCallback(
    (destination: 'feedback' | 'home') => {
      const navigate = async () => {
        setShowExitModal(false);
        setShowCompletionModal(false);
        await persistRideCompletion();
        await clearRideSessionAndStopTracking();
        await clearRideNotifications().catch(() => {});

        if (destination === 'feedback') {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'RouteFeedback',
                params: routeId
                  ? { routeId, route, rideSummary }
                  : route
                    ? { route, rideSummary }
                    : undefined,
              },
            ],
          });
          return;
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'HomePage' }],
        });
      };

      void navigate();
    },
    [navigation, persistRideCompletion, rideSummary, route, routeId],
  );

  const goFeedback = useCallback(() => {
    finalizeCompletedRide('feedback');
  }, [finalizeCompletedRide]);

  const finishCompletedRide = useCallback(() => {
    finalizeCompletedRide('home');
  }, [finalizeCompletedRide]);

  const abandonIncompleteRide = useCallback(() => {
    const navigate = async () => {
      setShowExitModal(false);
      setShowCompletionModal(false);
      await clearRideSessionAndStopTracking();
      await clearRideNotifications().catch(() => {});
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomePage' }],
      });
    };

    void navigate();
  }, [navigation]);

  const stopCycling = () => {
    if (routeCompleted) {
      setShowCompletionModal(true);
      return;
    }
    setShowExitModal(true);
  };

  const confirmEndRide = () => {
    if (routeCompleted) {
      goFeedback();
      return;
    }

    abandonIncompleteRide();
  };

  return {
    navigation,
    route,
    routeLoading: routeLoading || !sessionReady,
    progress: displayProgressPct,
    elapsedSec,
    routeCompleted,
    checkpointsVisitedCount,
    isPaused,
    currentCheckpoint,
    checkpointBanner,
    showExitModal,
    setShowExitModal,
    showCompletionModal,
    setShowCompletionModal,
    lineCoords,
    lineFeature,
    bounds,
    riderPoint,
    riderLngLat,
    riderHasFix,
    offRouteWarning,
    metersFromRoute,
    locationDenied,
    locationReady,
    locationIssue,
    formatTime,
    distanceTraveled,
    rideSummary,
    pauseRide,
    resumeRide,
    goFeedback,
    finishCompletedRide,
    stopCycling,
    confirmEndRide,
    visitedPoiIndices,
  };
}
