import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  MarkerView,
  ShapeSource,
  StyleURL,
  setAccessToken,
} from '@rnmapbox/maps';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Route } from '../../../../shared/types/index';
import { getUserProfile, type UserProfile } from '../../services/userService';
import { useRideCompletionFeedback } from '../hooks/useRideCompletionFeedback';
import { useFloatingTabBarExtraLift } from '../utils/floatingTabBarInset';
import { useLiveMapRideState } from './useLiveMapRideState';
import { boundsFromCoordinates } from '@/utils/routeGeometry';
import {
  liveMapEndPointCollection,
  liveMapStartPointCollection,
} from '@/utils/liveMapGeojson';
import RiderMarker from '../components/native/RiderMarker';
import CheckpointMarker from '../components/native/CheckpointMarker';
import PoiMarker from '../components/native/PoiMarker';

const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

function GlassSurface({
  isDark,
  tintLight,
  tintDark,
  fallbackLight,
  fallbackDark,
  style,
  children,
}: {
  isDark: boolean;
  tintLight: string;
  tintDark: string;
  fallbackLight: string;
  fallbackDark: string;
  style?: any;
  children?: React.ReactNode;
}) {
  const tintColor = isDark ? tintDark : tintLight;
  const fallbackBg = isDark ? fallbackDark : fallbackLight;

  if (!supportsNativeGlass) {
    return (
      <View style={[style, { backgroundColor: fallbackBg }]}>
        {children}
      </View>
    );
  }

  return (
    <GlassView
      style={style}
      glassEffectStyle="clear"
      colorScheme={isDark ? 'dark' : 'light'}
      tintColor={tintColor}
    >
      {children}
    </GlassView>
  );
}

export default function LiveMapMapboxScreen() {
  const { params } = useRoute<any>();
  const routeParam = params?.route as Route | undefined;
  const routeId = (params?.routeId as string | undefined) ?? routeParam?.id;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

  const {
    route,
    routeLoading,
    progress,
    elapsedSec,
    routeCompleted,
    checkpointsVisitedCount,
    isPaused,
    checkpointBanner,
    showExitModal,
    setShowExitModal,
    showCompletionModal,
    lineFeature,
    bounds,
    riderLngLat,
    riderHasFix,
    offRouteWarning,
    locationDenied,
    lineCoords,
    navigation,
    formatTime,
    distanceTraveled,
    rideSummary,
    pauseRide,
    resumeRide,
    goFeedback,
    stopCycling,
    confirmEndRide,
    currentCheckpoint,
    visitedPoiIndices,
  } = useLiveMapRideState(routeId, routeParam);

  useRideCompletionFeedback(routeCompleted);

  useEffect(() => {
    if (mapboxToken) {
      setAccessToken(mapboxToken);
    }
  }, [mapboxToken]);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => {
        // Non-fatal — marker falls back to plain blue circle
      });
  }, []);

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  const hasMap = Boolean(mapboxToken);

  const lineCoordsLen = useMemo(() => {
    if (lineFeature.geometry.type !== 'LineString') return 0;
    return lineFeature.geometry.coordinates.length;
  }, [lineFeature]);
  const bottomTabLift = useFloatingTabBarExtraLift(16);
  const cameraPaddingBottom = 220 + bottomTabLift;

  const navBounds = useMemo(() => {
    const coords = [...lineCoords];
    if (riderHasFix && riderLngLat) {
      coords.push(riderLngLat);
    }
    if (!coords.length) return bounds;
    return boundsFromCoordinates(coords);
  }, [lineCoords, riderLngLat, riderHasFix, bounds]);

  const startPointGeo = useMemo(() => liveMapStartPointCollection(route), [route]);
  const endPointGeo = useMemo(() => liveMapEndPointCollection(route), [route]);
  if (routeLoading) {
    return (
      <View style={styles.loading} testID="live-map-loading">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.missing} testID="live-map-missing">
        <Text style={styles.missingText}>Route not found</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('HomePage')}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="live-map-root">
      {hasMap && lineCoordsLen > 0 ? (
        <MapView
          style={StyleSheet.absoluteFill}
          styleURL={isDark ? 'mapbox://styles/mapbox/navigation-night-v1' : StyleURL.Street}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled
          testID="live-map-mapview"
        >
          <Camera
            bounds={{
              ne: navBounds.ne,
              sw: navBounds.sw,
              paddingTop: 160,
              paddingBottom: cameraPaddingBottom,
              paddingLeft: 32,
              paddingRight: 32,
            }}
            animationMode="easeTo"
            animationDuration={350}
          />
          <ShapeSource id="routeLine" shape={lineFeature}>
            <LineLayer
              id="routeLineLayer"
              style={{
                lineColor: '#2563eb',
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>

          {endPointGeo.features.length > 0 ? (
            <ShapeSource id="liveMapRouteEnd" shape={endPointGeo}>
              <CircleLayer
                id="routeEndDot"
                style={{ circleRadius: 8, circleColor: isDark ? '#f87171' : '#dc2626', circleStrokeWidth: 2.5, circleStrokeColor: '#ffffff' }}
              />
            </ShapeSource>
          ) : null}
          {(route.checkpoints ?? []).map((cp, i) =>
            cp.lat === 0 && cp.lng === 0 ? null : (
              <MarkerView key={cp.id} coordinate={[cp.lng, cp.lat]} anchor={{ x: 0.5, y: 0.5 }}>
                <CheckpointMarker visited={i < currentCheckpoint} />
              </MarkerView>
            )
          )}

          {(route.pointsOfInterestVisited ?? []).map((poi, i) =>
            visitedPoiIndices.has(i) ||
            typeof poi.lat !== 'number' ||
            typeof poi.lng !== 'number' ||
            !poi.category ? null : (
              <MarkerView key={`poi-${i}`} coordinate={[poi.lng, poi.lat]} anchor={{ x: 0.5, y: 1.0 }}>
                <PoiMarker category={poi.category} />
              </MarkerView>
            )
          )}

          {riderHasFix && riderLngLat ? (
            <MarkerView coordinate={riderLngLat} anchor={{ x: 0.5, y: 0.5 }}>
              <View testID="rider-marker-container">
                <RiderMarker
                  avatarUrl={profile?.avatarUrl}
                  avatarColor={profile?.avatarColor ?? '#2563eb'}
                  initials={initials}
                />
              </View>
            </MarkerView>
          ) : null}
        </MapView>
      ) : (
        <View style={styles.mapFallback} testID="live-map-no-token">
          <Text style={styles.fallbackTitle}>Mapbox token required</Text>
          <Text style={styles.fallbackBody}>
            Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env and use a development build to show the live map.
            Route polyline coordinates are still computed for QA (see unit tests).
          </Text>
        </View>
      )}

      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        <GlassSurface
          isDark={isDark}
          tintLight="rgba(255,255,255,0.72)"
          tintDark="rgba(15,23,42,0.78)"
          fallbackLight="rgba(255,255,255,0.92)"
          fallbackDark="rgba(15,23,42,0.92)"
          style={styles.statsCard}
        >
          <View style={styles.statsCardInner} testID="live-map-stats-card">
            <Text style={styles.statsPct}>{progress.toFixed(0)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.statsFooter}>
              {(route.checkpoints?.length ?? 0) > 0 && (
                <Text style={styles.statsMeta}>
                  {checkpointsVisitedCount}/{route.checkpoints.length} checkpoints
                </Text>
              )}
              <Text style={styles.statsMeta}>{distanceTraveled} km traveled</Text>
            </View>
            <View style={styles.startEndRow} testID="live-map-start-end-legend">
              <View style={styles.startEndItem}>
                <View style={[styles.routeDot, styles.routeDotStart]} accessibilityLabel="Route start" />
                <Text style={styles.startEndLabel} numberOfLines={1}>
                  Start - {route.startPoint.name}
                </Text>
              </View>
              <View style={styles.startEndItem}>
                <View style={[styles.routeDot, styles.routeDotEnd]} accessibilityLabel="Route end" />
                <Text style={styles.startEndLabel} numberOfLines={1}>
                  End - {route.endPoint.name}
                </Text>
              </View>
            </View>
          </View>
        </GlassSurface>

        {checkpointBanner ? (
          <GlassSurface
            isDark={isDark}
            tintLight="rgba(220,252,231,0.82)"
            tintDark="rgba(20,83,45,0.82)"
            fallbackLight="#dcfce7"
            fallbackDark="#14532d"
            style={styles.banner}
          >
            <View style={styles.bannerInner} testID="live-map-checkpoint-banner">
              <Text style={styles.bannerTitle}>Checkpoint reached!</Text>
              <Text style={styles.bannerBody}>{checkpointBanner}</Text>
            </View>
          </GlassSurface>
        ) : null}

        {locationDenied ? (
          <GlassSurface
            isDark={isDark}
            tintLight="rgba(254,243,199,0.82)"
            tintDark="rgba(120,53,15,0.82)"
            fallbackLight="#fef3c7"
            fallbackDark="#78350f"
            style={styles.warnBanner}
          >
            <View style={styles.warnBannerInner} testID="live-map-location-denied">
              <Text style={styles.warnTitle}>Location off</Text>
              <Text style={styles.warnBody}>Enable location permission to see your position and progress on the route.</Text>
            </View>
          </GlassSurface>
        ) : null}

        {offRouteWarning ? (
          <GlassSurface
            isDark={isDark}
            tintLight="rgba(254,243,199,0.82)"
            tintDark="rgba(120,53,15,0.82)"
            fallbackLight="#fef3c7"
            fallbackDark="#78350f"
            style={styles.warnBanner}
          >
            <View style={styles.warnBannerInner} testID="live-map-off-route">
              <Text style={styles.warnTitle}>Off route</Text>
              <Text style={styles.warnBody}>You are far from the planned route. Head back toward the blue line when safe.</Text>
            </View>
          </GlassSurface>
        ) : null}
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']} testID="live-map-bottom-bar">
        <View style={[styles.bottomInner, { paddingBottom: 16 + bottomTabLift }]}>
          <View style={styles.bottomGrid}>
            <View>
              <Text style={styles.bottomLabel}>Elapsed Time</Text>
              <Text style={styles.bottomValueBlue} testID="live-map-elapsed">
                {formatTime(elapsedSec)}
              </Text>
            </View>
            <View>
              <Text style={styles.bottomLabel}>Distance</Text>
              <Text style={styles.bottomValueGreen} testID="live-map-distance">
                {distanceTraveled} km
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.pauseBtn, isPaused && styles.resumeBtn]}
            onPress={isPaused ? resumeRide : pauseRide}
            testID="live-map-pause"
          >
            <Text style={styles.pauseBtnText}>{isPaused ? 'Resume Ride' : 'Pause Ride'}</Text>
          </Pressable>
          <Pressable style={styles.stopBtn} onPress={stopCycling} testID="live-map-stop">
            <Text style={styles.stopBtnText}>Stop Cycling</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={showCompletionModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <GlassSurface
            isDark={isDark}
            tintLight="rgba(255,255,255,0.88)"
            tintDark="rgba(15,23,42,0.92)"
            fallbackLight="#ffffff"
            fallbackDark="#0f172a"
            style={styles.modalCard}
          >
            <View style={styles.modalCardInner} testID="live-map-complete-modal" accessibilityViewIsModal accessibilityLiveRegion="polite">
              <View style={styles.modalCelebration} accessible accessibilityRole="image" accessibilityLabel="Destination reached">
                <MaterialCommunityIcons name="flag-checkered" size={40} color="#16a34a" />
              </View>
              <Text style={styles.modalTitle}>You've arrived!</Text>
              <Text style={styles.modalSub}>Destination reached - congratulations on finishing your ride.</Text>
              <Text style={styles.modalMeta}>Distance: {rideSummary.distanceKm.toFixed(2)} km</Text>
              <Text style={styles.modalMeta}>Time: {rideSummary.elapsedMinutes} minutes</Text>
              <Text style={styles.modalMeta}>Checkpoints: {rideSummary.checkpointsVisited}</Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={goFeedback}
                  testID="live-map-complete-dismiss"
                >
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </GlassSurface>
        </View>
      </Modal>

      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <GlassSurface
            isDark={isDark}
            tintLight="rgba(255,255,255,0.88)"
            tintDark="rgba(15,23,42,0.92)"
            fallbackLight="#ffffff"
            fallbackDark="#0f172a"
            style={styles.modalCard}
          >
            <View style={styles.modalCardInner}>
              <Text style={styles.modalTitle}>End Ride?</Text>
              <Text style={styles.modalSub}>
                Ending before completion will discard this ride. Pause it if you want to continue later.
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setShowExitModal(false)}
                  testID="live-map-exit-cancel"
                >
                  <Text style={styles.secondaryBtnText}>Keep Riding</Text>
                </Pressable>
                <Pressable style={styles.dangerBtn} onPress={confirmEndRide} testID="live-map-exit-confirm">
                  <Text style={styles.dangerBtnText}>End Ride</Text>
                </Pressable>
              </View>
            </View>
          </GlassSurface>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    root: { flex: 1, backgroundColor: isDark ? '#0f172a' : '#e2e8f0' },
    mapFallback: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? '#1e293b' : '#dbeafe',
      justifyContent: 'center',
      padding: 24,
    },
    fallbackTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#93c5fd' : '#1e3a8a',
      marginBottom: 8,
    },
    fallbackBody: { fontSize: 14, color: isDark ? '#60a5fa' : '#1e40af', lineHeight: 20 },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
    statsCard: {
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    statsCardInner: { padding: 14 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statsTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f1f5f9' : '#0f172a',
      marginRight: 8,
    },
    statsPct: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    progressTrack: {
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: isDark ? '#3b82f6' : '#2563eb', borderRadius: 3 },
    statsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    statsMeta: { fontSize: 12, color: '#64748b' },
    startEndRow: { marginTop: 10, gap: 6 },
    startEndItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#ffffff' },
    routeDotStart: { backgroundColor: isDark ? '#22c55e' : '#16a34a' },
    routeDotEnd: { backgroundColor: isDark ? '#f87171' : '#dc2626' },
    startEndLabel: { flex: 1, fontSize: 11, color: isDark ? '#94a3b8' : '#475569', fontWeight: '600' },
    banner: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#166534' : '#86efac',
    },
    bannerInner: { padding: 12 },
    bannerTitle: { fontWeight: '800', color: isDark ? '#bbf7d0' : '#166534', marginBottom: 4 },
    bannerBody: { fontSize: 13, color: isDark ? '#86efac' : '#15803d' },
    warnBanner: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#92400e' : '#fcd34d',
    },
    warnBannerInner: { padding: 12 },
    warnTitle: { fontWeight: '800', color: isDark ? '#fde68a' : '#92400e', marginBottom: 4 },
    warnBody: { fontSize: 13, color: isDark ? '#fcd34d' : '#a16207', lineHeight: 18 },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
      backgroundColor: isDark ? '#000000' : '#ffffff',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    },
    bottomInner: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    bottomGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    bottomLabel: { fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4 },
    bottomValueBlue: { fontSize: 22, fontWeight: '800', color: isDark ? '#3b82f6' : '#2563eb' },
    bottomValueGreen: { fontSize: 22, fontWeight: '800', color: isDark ? '#22c55e' : '#16a34a' },
    stopBtn: { backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    pauseBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#0f172a',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
    },
    resumeBtn: { backgroundColor: isDark ? '#15803d' : '#16a34a' },
    pauseBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
    stopBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
    missing: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    missingText: { fontSize: 16, color: isDark ? '#94a3b8' : '#475569', marginBottom: 16 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      borderRadius: 20,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 360,
    },
    modalCardInner: { padding: 24 },
    modalCelebration: { alignItems: 'center', marginBottom: 12 },
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isDark ? '#f1f5f9' : '#0f172a',
      marginBottom: 8,
    },
    modalSub: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
    modalMeta: { fontSize: 14, color: isDark ? '#94a3b8' : '#334155', marginBottom: 4 },
    primaryBtn: {
      backgroundColor: isDark ? '#3b82f6' : '#2563eb',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      alignItems: 'center',
      flex: 1,
    },
    primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
    modalActions: { gap: 10, marginTop: 8 },
    secondaryBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' },
    dangerBtn: { backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    dangerBtnText: { color: '#ffffff', fontWeight: '800' },
  });
}
