import { memo, useEffect, useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  ShapeSource,
  StyleURL,
  setAccessToken,
} from '@rnmapbox/maps';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Route } from '../../../../shared/types/index';
import { useFloatingTabBarExtraLift } from '../utils/floatingTabBarInset';
import { useLiveMapRideState } from './useLiveMapRideState';

type LiveMapCanvasProps = {
  bounds: { ne: [number, number]; sw: [number, number] };
  cameraPaddingBottom: number;
  lineFeature: {
    type: 'Feature';
    properties: Record<string, never>;
    geometry: { type: 'LineString'; coordinates: Array<[number, number]> };
  };
  riderPoint: {
    type: 'Feature';
    properties: Record<string, never>;
    geometry: { type: 'Point'; coordinates: [number, number] };
  };
};

const LiveMapCanvas = memo(function LiveMapCanvas({
  bounds,
  cameraPaddingBottom,
  lineFeature,
  riderPoint,
}: LiveMapCanvasProps) {
  return (
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
          ne: bounds.ne,
          sw: bounds.sw,
          paddingTop: 160,
          paddingBottom: cameraPaddingBottom,
          paddingLeft: 32,
          paddingRight: 32,
        }}
        animationDuration={0}
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
      <ShapeSource id="riderPoint" shape={riderPoint}>
        <CircleLayer
          id="riderCircle"
          style={{
            circleRadius: 8,
            circleColor: '#2563eb',
            circleStrokeWidth: 2,
            circleStrokeColor: '#ffffff',
          }}
        />
      </ShapeSource>
    </MapView>
  );
});

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
    isPaused,
    currentCheckpoint,
    checkpointBanner,
    showExitModal,
    setShowExitModal,
    showCompletionModal,
    setShowCompletionModal,
    lineFeature,
    bounds,
    riderPoint,
    navigation,
    formatTime,
    distanceTraveled,
    rideSummary,
    pauseRide,
    resumeRide,
    finishCompletedRide,
    goFeedback,
    stopCycling,
    confirmEndRide,
  } = useLiveMapRideState(routeId, routeParam);

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
        <LiveMapCanvas
          bounds={bounds}
          cameraPaddingBottom={cameraPaddingBottom}
          lineFeature={lineFeature}
          riderPoint={riderPoint}
        />
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
              {currentCheckpoint}/{route.checkpoints.length} checkpoints
            </Text>
            <Text style={styles.statsMeta}>{distanceTraveled} km traveled</Text>
          </View>
        </View>

        {checkpointBanner ? (
          <View style={styles.banner} testID="live-map-checkpoint-banner">
            <Text style={styles.bannerTitle}>Checkpoint reached!</Text>
            <Text style={styles.bannerBody}>{checkpointBanner}</Text>
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
          <View style={styles.modalCard} testID="live-map-complete-modal">
            <Text style={styles.modalTitle}>Route Completed!</Text>
            <Text style={styles.modalSub}>Congratulations on finishing your ride.</Text>
            <Text style={styles.modalMeta}>Distance: {rideSummary.distanceKm.toFixed(2)} km</Text>
            <Text style={styles.modalMeta}>Time: {rideSummary.elapsedMinutes} minutes</Text>
            <Text style={styles.modalMeta}>Checkpoints: {rideSummary.checkpointsVisited}</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={finishCompletedRide}
                testID="live-map-complete-dismiss"
              >
                <Text style={styles.secondaryBtnText}>Close</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={goFeedback} testID="live-map-feedback-btn">
                <Text style={styles.primaryBtnText}>End Route & Give Feedback</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
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
  pauseBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resumeBtn: {
    backgroundColor: '#16a34a',
  },
  pauseBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
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
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    flex: 1,
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
