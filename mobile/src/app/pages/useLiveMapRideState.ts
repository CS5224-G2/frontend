import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Route } from '../../../../shared/types/index';
import { resolveRouteById } from '../../services/routeLookup';
import { saveRide } from '../../services/rideService';
import { LIVE_MAP_PROGRESS_SIMULATION } from '../../config/runtime';
import { boundsFromCoordinates, interpolateAlongRoute, routeToLineCoordinates } from '@/utils/routeGeometry';

export function useLiveMapRideState(routeId: string | undefined, initialRoute?: Route | null) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [route, setRoute] = useState<Route | null>(initialRoute ?? null);
  const [routeLoading, setRouteLoading] = useState(!initialRoute);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const persistRidePromiseRef = useRef<Promise<void> | null>(null);

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

      const r = await resolveRouteById(routeId);
      if (!cancelled) {
        setRoute(r ?? initialRoute ?? null);
        setRouteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [checkpointBanner, setCheckpointBanner] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!LIVE_MAP_PROGRESS_SIMULATION) {
      return undefined;
    }

    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = prev + 2;
        if (next >= 100) {
          setRouteCompleted(true);
          return 100;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const lineCoords = useMemo(
    () => (route ? routeToLineCoordinates(route) : []),
    [route]
  );

  const lineFeature = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: lineCoords },
    }),
    [lineCoords]
  );

  const bounds = useMemo(() => boundsFromCoordinates(lineCoords), [lineCoords]);

  const riderPosition = useMemo(
    () =>
      lineCoords.length ? interpolateAlongRoute(lineCoords, progress / 100) : [0, 0],
    [lineCoords, progress]
  );

  const riderPoint = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Point' as const, coordinates: riderPosition },
    }),
    [riderPosition]
  );

  useEffect(() => {
    if (!route || !lineCoords.length) return undefined;
    const n = route.checkpoints.length;
    const threshold = 100 / (n + 1);
    const expected = Math.floor(progress / threshold);
    if (expected > currentCheckpoint && expected <= n) {
      setCurrentCheckpoint(expected);
      const cp = route.checkpoints[expected - 1];
      if (cp) {
        setCheckpointBanner(`${cp.name} — ${cp.description}`);
        const t = setTimeout(() => setCheckpointBanner(null), 3000);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [progress, route, lineCoords.length, currentCheckpoint]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const distanceTraveled = route ? ((route.distance * progress) / 100).toFixed(2) : '0.00';

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
        startTime: sessionStartedAtRef.current,
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
    route,
    routeCompleted,
    routeId,
  ]);

  const goFeedback = useCallback(() => {
    const navigate = async () => {
      // Dismiss modals before navigating: LiveMap stays mounted under the stack and RN Modal
      // can otherwise stay visible on top of Route Feedback.
      setRouteCompleted(false);
      setShowExitModal(false);
      await persistRideCompletion();
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
    routeLoading,
    progress,
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
