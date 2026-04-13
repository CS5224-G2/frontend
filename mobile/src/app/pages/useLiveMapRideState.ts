import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import type { Route } from '../../../../shared/types/index';
import { resolveRouteById } from '../../services/routeLookup';
import { saveRide } from '../../services/rideService';
import {
  type LngLat,
  boundsFromCoordinates,
  haversineMeters,
  projectPointOntoPolyline,
  routeToLineCoordinates,
} from '@/utils/routeGeometry';

/** Warn when GPS is farther than this from the planned polyline (meters). */
const OFF_ROUTE_WARNING_METERS = 80;
/** Count a checkpoint as visited when within this radius (meters). */
const CHECKPOINT_VISIT_METERS = 45;
/** Trigger arrival modal when this close to the route end (meters). */
const COMPLETION_END_METERS = 55;
/**
 * For loop routes (start ≈ end), require this much progress along the polyline before
 * end proximity counts as "arrived" (avoids instant completion at the start).
 */
const LOOP_COMPLETION_MIN_PROGRESS = 0.82;
/** Point-to-point: still require meaningful progress before end proximity completes the ride. */
const MIN_PROGRESS_FOR_COMPLETION = 0.78;

export function useLiveMapRideState(routeId: string | undefined, initialRoute?: Route | null) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [route, setRoute] = useState<Route | null>(initialRoute ?? null);
  const [routeLoading, setRouteLoading] = useState(!initialRoute);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const persistRidePromiseRef = useRef<Promise<void> | null>(null);

  const [riderLngLat, setRiderLngLat] = useState<LngLat | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [metersFromRoute, setMetersFromRoute] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [checkpointsVisitedCount, setCheckpointsVisitedCount] = useState(0);
  const [checkpointBanner, setCheckpointBanner] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const visitedCheckpointIdsRef = useRef<Set<string>>(new Set());
  const routeCompletedRef = useRef(false);

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

  useEffect(() => {
    visitedCheckpointIdsRef.current = new Set();
    setCheckpointsVisitedCount(0);
    setCheckpointBanner(null);
    setRouteCompleted(false);
    routeCompletedRef.current = false;
    setProgress(0);
    setMetersFromRoute(null);
    setRiderLngLat(null);
    setLocationReady(false);
    setLocationDenied(false);
  }, [route?.id]);

  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const lineCoords = useMemo(() => (route ? routeToLineCoordinates(route) : []), [route]);

  const isLoopRoute = useMemo(() => {
    if (!route) return false;
    return haversineMeters(route.startPoint.lat, route.startPoint.lng, route.endPoint.lat, route.endPoint.lng) < 60;
  }, [route]);

  const completionMinProgress = isLoopRoute ? LOOP_COMPLETION_MIN_PROGRESS : MIN_PROGRESS_FOR_COMPLETION;

  useEffect(() => {
    if (!route || lineCoords.length < 2) {
      return undefined;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setLocationDenied(true);
        setLocationReady(true);
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          if (cancelled) return;
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          setRiderLngLat([lng, lat]);
          setLocationReady(true);

          const proj = projectPointOntoPolyline(lat, lng, lineCoords);
          setMetersFromRoute(proj.distToRouteM);
          setProgress(proj.progress01 * 100);

          const distToEnd = haversineMeters(lat, lng, route.endPoint.lat, route.endPoint.lng);
          if (
            distToEnd < COMPLETION_END_METERS &&
            proj.progress01 >= completionMinProgress &&
            !routeCompletedRef.current
          ) {
            routeCompletedRef.current = true;
            setRouteCompleted(true);
          }

          for (const cp of route.checkpoints) {
            if (visitedCheckpointIdsRef.current.has(cp.id)) continue;
            const d = haversineMeters(lat, lng, cp.lat, cp.lng);
            if (d < CHECKPOINT_VISIT_METERS) {
              visitedCheckpointIdsRef.current.add(cp.id);
              setCheckpointsVisitedCount(visitedCheckpointIdsRef.current.size);
              setCheckpointBanner(`${cp.name} — ${cp.description}`);
              setTimeout(() => setCheckpointBanner(null), 4000);
              break;
            }
          }
        },
      );
    })().catch(() => {
      if (!cancelled) {
        setLocationDenied(true);
        setLocationReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [route, lineCoords, completionMinProgress]);

  const lineFeature = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: lineCoords },
    }),
    [lineCoords],
  );

  const bounds = useMemo(() => boundsFromCoordinates(lineCoords), [lineCoords]);

  const riderPoint = useMemo(
    () =>
      riderLngLat
        ? {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Point' as const, coordinates: riderLngLat },
          }
        : null,
    [riderLngLat],
  );

  const offRouteWarning = useMemo(() => {
    if (metersFromRoute == null || !Number.isFinite(metersFromRoute)) return false;
    return metersFromRoute > OFF_ROUTE_WARNING_METERS;
  }, [metersFromRoute]);

  const distanceTraveledKm = useMemo(() => {
    if (!route || lineCoords.length < 2 || !riderLngLat) return '0.00';
    const lat = riderLngLat[1];
    const lng = riderLngLat[0];
    const { cumulativeM } = projectPointOntoPolyline(lat, lng, lineCoords);
    return (cumulativeM / 1000).toFixed(2);
  }, [route, lineCoords, riderLngLat]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const persistRideCompletion = useCallback(async () => {
    if (!route || !routeId) {
      return;
    }

    if (!persistRidePromiseRef.current) {
      const completedDistance = routeCompleted ? route.distance : Number(distanceTraveledKm);
      const safeDistance = Number.isFinite(completedDistance) ? completedDistance : 0;
      const avgSpeed = elapsedSec > 0 ? Number((safeDistance / (elapsedSec / 3600)).toFixed(1)) : 0;

      persistRidePromiseRef.current = saveRide({
        route,
        startTime: sessionStartedAtRef.current,
        endTime: new Date().toISOString(),
        distance: safeDistance,
        avgSpeed,
        checkpointsVisited: checkpointsVisitedCount,
        pointsOfInterestVisited: route.pointsOfInterestVisited,
      })
        .then(() => {})
        .catch((error) => {
          console.warn('[LiveMap] Failed to persist completed ride', error);
        });
    }

    await persistRidePromiseRef.current;
  }, [
    checkpointsVisitedCount,
    distanceTraveledKm,
    elapsedSec,
    route,
    routeCompleted,
    routeId,
  ]);

  const goFeedback = useCallback(() => {
    const navigate = async () => {
      setRouteCompleted(false);
      routeCompletedRef.current = false;
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

  const confirmExit = () => {
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
    checkpointsVisitedCount,
    checkpointBanner,
    showExitModal,
    setShowExitModal,
    lineCoords,
    lineFeature,
    bounds,
    riderPoint,
    riderLngLat,
    riderHasFix: Boolean(riderLngLat),
    offRouteWarning,
    metersFromRoute,
    locationDenied,
    locationReady,
    formatTime,
    distanceTraveled: distanceTraveledKm,
    goFeedback,
    stopCycling,
    confirmExit,
  };
}
