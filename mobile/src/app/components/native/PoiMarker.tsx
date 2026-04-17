import React, { type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { PointOfInterestCategory } from '../../../../../shared/types/index';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PoiMarkerProps {
  category: PointOfInterestCategory;
}

const CATEGORY_CONFIG: Record<PointOfInterestCategory, { color: string; icon: MCIName }> = {
  hawkerCenter: { color: '#ea580c', icon: 'food' },
  historicSite: { color: '#92400e', icon: 'bank' },
  park: { color: '#15803d', icon: 'tree' },
  touristAttraction: { color: '#7c3aed', icon: 'star' },
};

export default function PoiMarker({ category }: PoiMarkerProps) {
  const { color, icon } = CATEGORY_CONFIG[category];

  return (
    <View style={styles.container}>
      <View
        testID="poi-marker-head"
        style={[styles.pinHead, { backgroundColor: color }]}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#ffffff" />
      </View>
      <View style={[styles.pinTail, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
