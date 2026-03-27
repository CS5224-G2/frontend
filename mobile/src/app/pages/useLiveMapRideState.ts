import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getRouteById } from '../types';
import { boundsFromCoordinates, interpolateAlongRoute, routeToLineCoordinates } from '@/utils/routeGeometry';

export function useLiveMapRideState(routeId: string | undefined) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = getRouteById(routeId);

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

  const goFeedback = () => navigation.navigate('RouteFeedback');

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
    confirmExit,
  };
}
