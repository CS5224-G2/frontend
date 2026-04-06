import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { Route } from '../../../../shared/types/index';
import { hasRouteCoordinates } from './routeDisplay';

/** True when the label is empty, generic, or a numeric / degree coordinate string (see routeService.finalizeRouteEndpoints). */
export function isCoordinatePlaceholderName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  if (/^unknown start$/i.test(t) || /^unknown end$/i.test(t)) return true;
  if (/^-?\d+\.\d+°\s*,\s*-?\d+\.\d+°$/.test(t)) return true;
  if (/^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(t)) return true;
  return false;
}

export function formatAddressFromGeocode(addresses: Location.LocationGeocodedAddress[]): string | null {
  const a = addresses[0];
  if (!a) return null;

  const parts = [a.name, a.street, a.district, a.subregion, a.city, a.region]
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      unique.push(p);
    }
  }

  const line = unique.slice(0, 4).join(', ');
  return line.length > 0 ? line : null;
}

export async function reverseGeocodePlaceLabel(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    return formatAddressFromGeocode(results);
  } catch {
    return null;
  }
}

function endpointFallbackLabel(point: Route['startPoint'], role: 'start' | 'end'): string {
  const label = role === 'start' ? 'Start' : 'End';
  if (hasRouteCoordinates(point.lat, point.lng)) {
    return `${point.lat.toFixed(4)}°, ${point.lng.toFixed(4)}°`;
  }
  return label;
}

/**
 * When start/end names from the API are missing or coordinate placeholders, resolves human-readable
 * labels via reverse geocoding. Otherwise returns the stored names unchanged.
 */
export function useRouteEndpointLabels(route: Route | null): { startLabel: string; endLabel: string } {
  const [resolved, setResolved] = useState<{ start?: string; end?: string }>({});

  useEffect(() => {
    setResolved({});
    if (!route) return;

    let cancelled = false;

    const run = async () => {
      const next: { start?: string; end?: string } = {};

      const sp = route.startPoint;
      const ep = route.endPoint;

      if (isCoordinatePlaceholderName(sp.name) && hasRouteCoordinates(sp.lat, sp.lng)) {
        const g = await reverseGeocodePlaceLabel(sp.lat, sp.lng);
        if (g) next.start = g;
      }
      if (isCoordinatePlaceholderName(ep.name) && hasRouteCoordinates(ep.lat, ep.lng)) {
        const g = await reverseGeocodePlaceLabel(ep.lat, ep.lng);
        if (g) next.end = g;
      }

      if (!cancelled && (next.start !== undefined || next.end !== undefined)) {
        setResolved(next);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    route?.id,
    route?.startPoint.lat,
    route?.startPoint.lng,
    route?.startPoint.name,
    route?.endPoint.lat,
    route?.endPoint.lng,
    route?.endPoint.name,
  ]);

  if (!route) {
    return { startLabel: '', endLabel: '' };
  }

  const startBase = route.startPoint.name.trim() || endpointFallbackLabel(route.startPoint, 'start');
  const endBase = route.endPoint.name.trim() || endpointFallbackLabel(route.endPoint, 'end');

  return {
    startLabel: resolved.start ?? startBase,
    endLabel: resolved.end ?? endBase,
  };
}
