import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CheckpointMarkerProps {
  visited: boolean;
}

export default function CheckpointMarker({ visited }: CheckpointMarkerProps) {
  const haloColor = visited ? 'rgba(22,163,74,0.22)' : 'rgba(37,99,235,0.22)';
  const midColor = visited ? 'rgba(22,163,74,0.42)' : 'rgba(37,99,235,0.42)';
  const coreColor = visited ? '#16a34a' : '#2563eb';

  return (
    <View style={styles.container}>
      <View style={[styles.outerHalo, { backgroundColor: haloColor }]} />
      <View style={[styles.midRing, { backgroundColor: midColor }]} />
      <View
        testID="checkpoint-marker-inner"
        style={[styles.innerCircle, { backgroundColor: coreColor }]}
      >
        {visited && (
          <MaterialCommunityIcons
            testID="checkpoint-marker-check"
            name="check"
            size={12}
            color="#ffffff"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  midRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  innerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
