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
  notifyRidePaused,
  notifyRideResumed,
  notifyRideTrackingInBackground,
} from '../../services/rideNotifications';
import {
  boundsFromCoordinates,
  haversineDistanceKm,
  interpolateAlongRoute,
  routeToLineCoordinates,
  type LngLat,
} from '@/utils/routeGeometry';

type TrackingState = {
  position: LngLat | null;
  distanceKm: number;
  progressPct: number;
};

const EMPTY_TRACKING: TrackingState = {
  position: null,
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
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const persistRidePromiseRef = useRef<Promise<void> | null>(null);
  const initializedSessionRouteIdRef = useRef<string | undefined>(undefined);
  const previousCheckpointRef = useRef(0);
  const completionModalShownRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

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
      distanceKm: session.distanceKm ?? 0,
      progressPct: session.progressPct ?? 0,
    });

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
    initializedSessionRouteIdRef.current = undefined;
    persistRidePromiseRef.current = null;
    previousCheckpointRef.current = 0;
    completionModalShownRef.current = false;
  }, [routeId]);

  useEffect(() => {
    const updateNow = () => setNowMs(Date.now());
    const id = setInterval(updateNow, 1000);
    const sub = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active') {
        updateNow();
        void clearRideNotifications().catch(() => {});
        void hydrateTrackingFromSession();
      }

      if (
        previousState === 'active' &&
        (nextState === 'background' || nextState === 'inactive') &&
        route &&
        sessionReady &&
        !sessionPausedAt
      ) {
        void notifyRideTrackingInBackground(route.name).catch(() => {});
      }
    });
    updateNow();

    return () => {
      clearInterval(id);
      sub?.remove?.();
    };
  }, [hydrateTrackingFromSession, route, sessionPausedAt, sessionReady]);

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
        void ensureRideNotificationPermission().catch(() => {});
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
      void ensureRideNotificationPermission().catch(() => {});
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

    async function startWatching() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active || permission.status !== 'granted') {
        return;
      }

      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!active) {
        return;
      }

      applyTrackedPosition(
        [initialPosition.coords.longitude, initialPosition.coords.latitude],
        initialPosition.coords.accuracy,
      );

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

  const riderPosition = useMemo<LngLat>(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION) {
      return lineCoords.length ? interpolateAlongRoute(lineCoords, progressPct / 100) : [0, 0];
    }

    return tracking.position ?? lineCoords[0] ?? [0, 0];
  }, [lineCoords, progressPct, tracking.position]);

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

  const distanceToEndKm = useMemo(() => {
    if (!route || !tracking.position) {
      return Number.POSITIVE_INFINITY;
    }

    return haversineDistanceKm(tracking.position, [route.endPoint.lng, route.endPoint.lat]);
  }, [route, tracking.position]);

  const routeCompleted = LIVE_MAP_PROGRESS_SIMULATION
    ? progressPct >= 99
    : progressPct >= 98 || (progressPct >= 95 && distanceToEndKm <= 0.03);

  useEffect(() => {
    if (!routeCompleted || completionModalShownRef.current) {
      return;
    }

    completionModalShownRef.current = true;
    const completedAt = new Date().toISOString();
    setSessionCompletedAt(completedAt);
    setSessionPausedAt(null);
    setShowCompletionModal(true);

    void clearRideNotifications()
      .catch(() => {})
      .then(() => clearRideSessionAndStopTracking())
      .catch((error) => {
        console.warn('[LiveMap] Failed to finalize completed ride session', error);
      });
  }, [routeCompleted]);

  const currentCheckpoint = useMemo(() => {
    if (!route || !route.checkpoints.length) {
      return 0;
    }

    const threshold = 100 / (route.checkpoints.length + 1);
    return Math.min(route.checkpoints.length, Math.floor(progressPct / threshold));
  }, [progressPct, route]);

  useEffect(() => {
    if (!route || !lineCoords.length) {
      previousCheckpointRef.current = 0;
      return undefined;
    }

    if (currentCheckpoint > previousCheckpointRef.current) {
      const checkpoint = route.checkpoints[currentCheckpoint - 1];
      if (checkpoint) {
        setCheckpointBanner(`${checkpoint.name} — ${checkpoint.description}`);
        const timer = setTimeout(() => setCheckpointBanner(null), 3000);
        previousCheckpointRef.current = currentCheckpoint;
        return () => clearTimeout(timer);
      }
    }

    previousCheckpointRef.current = currentCheckpoint;
    return undefined;
  }, [currentCheckpoint, lineCoords.length, route]);

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
    };

    void run();
  }, [buildSession, isRideFinished, route]);

  const goFeedback = useCallback(() => {
    const navigate = async () => {
      setShowExitModal(false);
      setShowCompletionModal(false);
      await persistRideCompletion();
      await clearRideNotifications().catch(() => {});
      await clearRideSessionAndStopTracking();
      if (routeId) {
        navigation.navigate('RouteFeedback', { routeId, route, rideSummary });
      } else {
        navigation.navigate('RouteFeedback', route ? { route, rideSummary } : undefined);
      }
    };

    void navigate();
  }, [navigation, persistRideCompletion, rideSummary, route, routeId]);

  const abandonIncompleteRide = useCallback(() => {
    const navigate = async () => {
      setShowExitModal(false);
      setShowCompletionModal(false);
      await clearRideNotifications().catch(() => {});
      await clearRideSessionAndStopTracking();
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
    progress: progressPct,
    elapsedSec,
    routeCompleted,
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
    formatTime,
    distanceTraveled,
    rideSummary,
    pauseRide,
    resumeRide,
    goFeedback,
    stopCycling,
    confirmEndRide,
  };
}
