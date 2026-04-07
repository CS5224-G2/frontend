import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Route } from '../../../../shared/types/index';
import {
  clearActiveRideSession,
  loadActiveRideSession,
  saveActiveRideSession,
} from '../../services/activeRideSession';
import { LIVE_MAP_PROGRESS_SIMULATION } from '../../config/runtime';
import { resolveRouteById } from '../../services/routeLookup';
import { saveRide } from '../../services/rideService';
import {
  boundsFromCoordinates,
  haversineDistanceKm,
  interpolateAlongRoute,
  projectPointOntoRoute,
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
  const [tracking, setTracking] = useState<TrackingState>(EMPTY_TRACKING);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [checkpointBanner, setCheckpointBanner] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const persistRidePromiseRef = useRef<Promise<void> | null>(null);
  const initializedSessionRouteIdRef = useRef<string | undefined>(undefined);
  const previousCheckpointRef = useRef(0);

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
    setTracking(EMPTY_TRACKING);
    setCheckpointBanner(null);
    setShowExitModal(false);
    initializedSessionRouteIdRef.current = undefined;
    persistRidePromiseRef.current = null;
    previousCheckpointRef.current = 0;
  }, [routeId]);

  useEffect(() => {
    const updateNow = () => setNowMs(Date.now());
    const id = setInterval(updateNow, 1000);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        updateNow();
      }
    });
    updateNow();

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

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
      const activeSession = await loadActiveRideSession();
      if (cancelled) {
        return;
      }

      if (activeSession?.routeId === routeId) {
        setSessionStartedAt(activeSession.startedAt);
        if (!initialRoute) {
          setRoute(activeSession.route);
        }
        setTracking({
          position: activeSession.lastKnownPosition
            ? [activeSession.lastKnownPosition.lng, activeSession.lastKnownPosition.lat]
            : null,
          distanceKm: activeSession.distanceKm ?? 0,
          progressPct: activeSession.progressPct ?? 0,
        });
        setSessionReady(true);
        return;
      }

      const startedAt = new Date().toISOString();
      setSessionStartedAt(startedAt);
      setTracking(EMPTY_TRACKING);
      setSessionReady(true);
      await saveActiveRideSession({
        version: 1,
        routeId,
        route,
        startedAt,
      });
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [initialRoute, route, routeId]);

  const lineCoords = useMemo(() => (route ? routeToLineCoordinates(route) : []), [route]);

  const applyTrackedPosition = useCallback(
    (nextPosition: LngLat, accuracyMeters?: number | null) => {
      setTracking((prev) => {
        if (typeof accuracyMeters === 'number' && accuracyMeters > 100) {
          return prev;
        }

        const incrementKm =
          prev.position === null ? 0 : haversineDistanceKm(prev.position, nextPosition);

        const acceptedIncrementKm =
          incrementKm >= 0.003 && incrementKm <= 0.5 ? incrementKm : 0;

        const projected = lineCoords.length
          ? projectPointOntoRoute(lineCoords, nextPosition)
          : { snappedPoint: nextPosition, progress: 0 };

        return {
          position: nextPosition,
          distanceKm: Number((prev.distanceKm + acceptedIncrementKm).toFixed(3)),
          progressPct: Math.max(prev.progressPct, projected.progress * 100),
        };
      });
    },
    [lineCoords]
  );

  useEffect(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION || !sessionReady || !route || !routeId) {
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
  }, [applyTrackedPosition, route, routeId, sessionReady]);

  useEffect(() => {
    if (!routeId || !route || !sessionStartedAt || !sessionReady) {
      return;
    }

    void saveActiveRideSession({
      version: 1,
      routeId,
      route,
      startedAt: sessionStartedAt,
      lastKnownPosition: tracking.position
        ? { lat: tracking.position[1], lng: tracking.position[0] }
        : undefined,
      distanceKm: tracking.distanceKm,
      progressPct: tracking.progressPct,
    });
  }, [routeId, route, sessionReady, sessionStartedAt, tracking]);

  const elapsedSec = useMemo(() => {
    if (!sessionStartedAt) {
      return 0;
    }

    const startedAtMs = Date.parse(sessionStartedAt);
    if (Number.isNaN(startedAtMs)) {
      return 0;
    }

    return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  }, [nowMs, sessionStartedAt]);

  const simulatedProgressPct = useMemo(
    () => Math.min(100, elapsedSec * 2),
    [elapsedSec]
  );

  const progressPct = LIVE_MAP_PROGRESS_SIMULATION
    ? simulatedProgressPct
    : tracking.progressPct;

  const riderPosition = useMemo(() => {
    if (LIVE_MAP_PROGRESS_SIMULATION) {
      return lineCoords.length ? interpolateAlongRoute(lineCoords, progressPct / 100) : [0, 0];
    }

    return tracking.position ?? (lineCoords[0] ?? [0, 0]);
  }, [lineCoords, progressPct, tracking.position]);

  const lineFeature = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: lineCoords },
    }),
    [lineCoords]
  );

  const bounds = useMemo(() => boundsFromCoordinates(lineCoords), [lineCoords]);

  const riderPoint = useMemo(
    () => ({
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

  const routeCompleted =
    progressPct >= 99 || (!LIVE_MAP_PROGRESS_SIMULATION && distanceToEndKm <= 0.05);

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

  const persistRideCompletion = useCallback(async () => {
    if (!route || !routeId) {
      return;
    }

    if (!persistRidePromiseRef.current) {
      const completedDistance = routeCompleted ? route.distance : Number(distanceTraveled);
      const safeDistance = Number.isFinite(completedDistance) ? completedDistance : 0;
      const avgSpeed = elapsedSec > 0 ? Number((safeDistance / (elapsedSec / 3600)).toFixed(1)) : 0;
      const checkpointsVisited = routeCompleted ? route.checkpoints.length : currentCheckpoint;

      persistRidePromiseRef.current = saveRide({
        route,
        startTime: sessionStartedAt ?? new Date(nowMs).toISOString(),
        endTime: new Date().toISOString(),
        distance: safeDistance,
        avgSpeed,
        checkpointsVisited,
        pointsOfInterestVisited: route.pointsOfInterestVisited,
      })
        .then(() => {})
        .catch((error) => {
          console.warn('[LiveMap] Failed to persist completed ride', error);
        });
    }

    await persistRidePromiseRef.current;
  }, [
    currentCheckpoint,
    distanceTraveled,
    elapsedSec,
    nowMs,
    route,
    routeCompleted,
    routeId,
    sessionStartedAt,
  ]);

  const goFeedback = useCallback(() => {
    const navigate = async () => {
      setShowExitModal(false);
      await persistRideCompletion();
      await clearActiveRideSession();
      if (routeId) {
        navigation.navigate('RouteFeedback', { routeId, route });
      } else {
        navigation.navigate('RouteFeedback', route ? { route } : undefined);
      }
    };

    void navigate();
  }, [navigation, persistRideCompletion, route, routeId]);

  const stopCycling = () => {
    if (routeCompleted) {
      goFeedback();
      return;
    }
    setShowExitModal(true);
  };

  const confirmEndRide = () => {
    setShowExitModal(false);
    goFeedback();
  };

  return {
    navigation,
    route,
    routeLoading: routeLoading || !sessionReady,
    progress: progressPct,
    elapsedSec,
    routeCompleted,
    currentCheckpoint,
    checkpointBanner,
    showExitModal,
    setShowExitModal,
    lineCoords,
    lineFeature,
    bounds,
    riderPoint,
    formatTime,
    distanceTraveled,
    goFeedback,
    stopCycling,
    confirmEndRide,
  };
}
