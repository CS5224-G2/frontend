import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  CircleLayer,
  Images,
  LineLayer,
  MapView,
  ShapeSource,
  StyleURL,
  SymbolLayer,
  setAccessToken,
} from '@rnmapbox/maps';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Route } from '../../../../shared/types/index';
import { useRideCompletionFeedback } from '../hooks/useRideCompletionFeedback';
import { useFloatingTabBarExtraLift } from '../utils/floatingTabBarInset';
import { useLiveMapRideState } from './useLiveMapRideState';
import { boundsFromCoordinates } from '@/utils/routeGeometry';
import {
  liveMapCheckpointCollection,
  liveMapEndPointCollection,
  liveMapFoodPoisAlongRoute,
  liveMapRiderHaloFeature,
  liveMapStartPointCollection,
} from '@/utils/liveMapGeojson';

const LIVE_MAP_RESTAURANT_PIN = require('../../../assets/live-map-restaurant-pin.png');

export default function LiveMapMapboxScreen() {
  const { params } = useRoute<any>();
  const routeParam = params?.route as Route | undefined;
  const routeId = (params?.routeId as string | undefined) ?? routeParam?.id;
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

  const {
    route,
    routeLoading,
    progress,
    elapsedSec,
    routeCompleted,
    checkpointsVisitedCount,
    checkpointBanner,
    showExitModal,
    setShowExitModal,
    lineFeature,
    bounds,
    riderPoint,
    riderLngLat,
    riderHasFix,
    offRouteWarning,
    locationDenied,
    lineCoords,
    navigation,
    formatTime,
    distanceTraveled,
    goFeedback,
    stopCycling,
    confirmExit,
  } = useLiveMapRideState(routeId, routeParam);

  useRideCompletionFeedback(routeCompleted);

  useEffect(() => {
    if (mapboxToken) {
      setAccessToken(mapboxToken);
    }
  }, [mapboxToken]);

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

  const checkpointGeo = useMemo(() => liveMapCheckpointCollection(route), [route]);
  const startPointGeo = useMemo(() => liveMapStartPointCollection(route), [route]);
  const endPointGeo = useMemo(() => liveMapEndPointCollection(route), [route]);
  const foodPoiGeo = useMemo(() => liveMapFoodPoisAlongRoute(route), [route]);
  const riderHalo = useMemo(
    () => (riderHasFix && riderLngLat ? liveMapRiderHaloFeature(riderLngLat) : null),
    [riderLngLat, riderHasFix],
  );

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
          styleURL={StyleURL.Street}
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
          <Images images={{ liveMapRestaurantPin: LIVE_MAP_RESTAURANT_PIN }} />
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
          {startPointGeo.features.length > 0 ? (
            <ShapeSource id="liveMapRouteStart" shape={startPointGeo}>
              <CircleLayer
                id="routeStartOuter"
                style={{
                  circleRadius: 12,
                  circleColor: '#22c55e',
                  circleOpacity: 0.35,
                }}
              />
              <CircleLayer
                id="routeStartInner"
                style={{
                  circleRadius: 7,
                  circleColor: '#16a34a',
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#ffffff',
                }}
              />
            </ShapeSource>
          ) : null}
          {endPointGeo.features.length > 0 ? (
            <ShapeSource id="liveMapRouteEnd" shape={endPointGeo}>
              <CircleLayer
                id="routeEndOuter"
                style={{
                  circleRadius: 12,
                  circleColor: '#f87171',
                  circleOpacity: 0.35,
                }}
              />
              <CircleLayer
                id="routeEndInner"
                style={{
                  circleRadius: 7,
                  circleColor: '#dc2626',
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#ffffff',
                }}
              />
            </ShapeSource>
          ) : null}
          {checkpointGeo.features.length > 0 ? (
            <ShapeSource id="liveMapCheckpoints" shape={checkpointGeo}>
              <CircleLayer
                id="checkpointOuter"
                style={{
                  circleRadius: 11,
                  circleColor: '#2563eb',
                  circleOpacity: 0.35,
                }}
              />
              <CircleLayer
                id="checkpointInner"
                style={{
                  circleRadius: 5,
                  circleColor: '#ffffff',
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#1d4ed8',
                }}
              />
            </ShapeSource>
          ) : null}
          {foodPoiGeo.features.length > 0 ? (
            <ShapeSource id="liveMapFoodPois" shape={foodPoiGeo}>
              <SymbolLayer
                id="foodPoiRestaurantIcon"
                style={{
                  iconImage: 'liveMapRestaurantPin',
                  iconSize: 0.95,
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                  iconAnchor: 'bottom',
                }}
              />
            </ShapeSource>
          ) : null}
          {riderHalo && riderPoint ? (
            <>
              <ShapeSource id="riderHalo" shape={riderHalo}>
                <CircleLayer
                  id="riderHaloLayer"
                  style={{
                    circleRadius: 22,
                    circleColor: '#2563eb',
                    circleOpacity: 0.22,
                  }}
                />
              </ShapeSource>
              <ShapeSource id="riderPoint" shape={riderPoint}>
                <CircleLayer
                  id="riderCircleOuter"
                  style={{
                    circleRadius: 14,
                    circleColor: '#93c5fd',
                    circleOpacity: 0.9,
                  }}
                />
                <CircleLayer
                  id="riderCircle"
                  style={{
                    circleRadius: 9,
                    circleColor: '#1d4ed8',
                    circleStrokeWidth: 3,
                    circleStrokeColor: '#ffffff',
                  }}
                />
              </ShapeSource>
            </>
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
        <View style={styles.statsCard} testID="live-map-stats-card">
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle} numberOfLines={1}>
              {route.name}
            </Text>
            <Text style={styles.statsPct}>{progress.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.statsFooter}>
            <Text style={styles.statsMeta}>
              {checkpointsVisitedCount}/{route.checkpoints.length} checkpoints
            </Text>
            <Text style={styles.statsMeta}>{distanceTraveled} km traveled</Text>
          </View>
          <View style={styles.startEndRow} testID="live-map-start-end-legend">
            <View style={styles.startEndItem}>
              <View style={[styles.routeDot, styles.routeDotStart]} accessibilityLabel="Route start" />
              <Text style={styles.startEndLabel} numberOfLines={1}>
                Start · {route.startPoint.name}
              </Text>
            </View>
            <View style={styles.startEndItem}>
              <View style={[styles.routeDot, styles.routeDotEnd]} accessibilityLabel="Route end" />
              <Text style={styles.startEndLabel} numberOfLines={1}>
                End · {route.endPoint.name}
              </Text>
            </View>
          </View>
        </View>

        {checkpointBanner ? (
          <View style={styles.banner} testID="live-map-checkpoint-banner">
            <Text style={styles.bannerTitle}>Checkpoint reached!</Text>
            <Text style={styles.bannerBody}>{checkpointBanner}</Text>
          </View>
        ) : null}

        {locationDenied ? (
          <View style={styles.warnBanner} testID="live-map-location-denied">
            <Text style={styles.warnTitle}>Location off</Text>
            <Text style={styles.warnBody}>Enable location permission to see your position and progress on the route.</Text>
          </View>
        ) : null}

        {offRouteWarning ? (
          <View style={styles.warnBanner} testID="live-map-off-route">
            <Text style={styles.warnTitle}>Off route</Text>
            <Text style={styles.warnBody}>You are far from the planned route. Head back toward the blue line when safe.</Text>
          </View>
        ) : null}
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
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
          <Pressable style={styles.stopBtn} onPress={stopCycling} testID="live-map-stop">
            <Text style={styles.stopBtnText}>Stop Cycling</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={routeCompleted} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={styles.modalCard}
            testID="live-map-complete-modal"
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
          >
            <View
              style={styles.modalCelebration}
              accessible
              accessibilityRole="image"
              accessibilityLabel="Destination reached"
            >
              <MaterialCommunityIcons name="flag-checkered" size={40} color="#16a34a" />
            </View>
            <Text style={styles.modalTitle}>You’ve arrived!</Text>
            <Text style={styles.modalSub}>Destination reached — congratulations on finishing your ride.</Text>
            <Text style={styles.modalMeta}>Distance: {route.distance} km</Text>
            <Text style={styles.modalMeta}>Time: {route.estimatedTime} minutes</Text>
            <Text style={styles.modalMeta}>Checkpoints: {route.checkpoints.length}</Text>
            <Pressable style={styles.primaryBtn} onPress={goFeedback} testID="live-map-feedback-btn">
              <Text style={styles.primaryBtnText}>End Route & Give Feedback</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Exit Live Navigation?</Text>
            <Text style={styles.modalSub}>
              You have not reached the destination yet. Exit live navigation? Your progress is saved and you can
              still leave feedback.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setShowExitModal(false)}
                testID="live-map-exit-cancel"
              >
                <Text style={styles.secondaryBtnText}>Continue Cycling</Text>
              </Pressable>
              <Pressable style={styles.dangerBtn} onPress={confirmExit} testID="live-map-exit-confirm">
                <Text style={styles.dangerBtnText}>Exit Navigation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  root: { flex: 1, backgroundColor: '#e2e8f0' },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: { fontSize: 18, fontWeight: '800', color: '#1e3a8a', marginBottom: 8 },
  fallbackBody: { fontSize: 14, color: '#1e40af', lineHeight: 20 },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statsTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a', marginRight: 8 },
  statsPct: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 3 },
  statsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statsMeta: { fontSize: 12, color: '#64748b' },
  startEndRow: { marginTop: 10, gap: 6 },
  startEndItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#ffffff' },
  routeDotStart: { backgroundColor: '#16a34a' },
  routeDotEnd: { backgroundColor: '#dc2626' },
  startEndLabel: { flex: 1, fontSize: 11, color: '#475569', fontWeight: '600' },
  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  bannerTitle: { fontWeight: '800', color: '#166534', marginBottom: 4 },
  bannerBody: { fontSize: 13, color: '#15803d' },
  warnBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  warnTitle: { fontWeight: '800', color: '#92400e', marginBottom: 4 },
  warnBody: { fontSize: 13, color: '#a16207', lineHeight: 18 },
  modalCelebration: { alignItems: 'center', marginBottom: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomInner: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  bottomGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  bottomLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  bottomValueBlue: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  bottomValueGreen: { fontSize: 22, fontWeight: '800', color: '#16a34a' },
  stopBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stopBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  missingText: { fontSize: 16, color: '#475569', marginBottom: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  modalMeta: { fontSize: 14, color: '#334155', marginBottom: 4 },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  modalActions: { gap: 10, marginTop: 8 },
  secondaryBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '700', color: '#0f172a' },
  dangerBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#ffffff', fontWeight: '800' },
});
