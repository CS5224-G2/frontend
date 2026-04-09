import type { MapMarkerProps } from 'react-native-maps';

/** Bottom-center of pin icon aligns with the geographic point (fixes Android/Google Maps offset). */
export const MAP_PIN_ANCHOR: NonNullable<MapMarkerProps['anchor']> = { x: 0.5, y: 1 };

/** Centered dot markers (start/end) should sit on the coordinate. */
export const MAP_DOT_ANCHOR: NonNullable<MapMarkerProps['anchor']> = { x: 0.5, y: 0.5 };

export function mapPinMarkerProps(): Pick<MapMarkerProps, 'anchor'> {
  return { anchor: MAP_PIN_ANCHOR };
}

export function mapDotMarkerProps(): Pick<MapMarkerProps, 'anchor'> {
  return { anchor: MAP_DOT_ANCHOR };
}
