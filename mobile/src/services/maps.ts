import * as Linking from 'expo-linking';

/**
 * Build Google Maps URL for turn-by-turn navigation.
 * See: https://developers.google.com/maps/documentation/urls/get-started#directions
 * Use origin, destination, and waypoints from backend route response.
 */
export function buildGoogleMapsUrl(params: {
  origin: string; // e.g. "lat,lng" or address
  destination: string;
  waypoints?: string[]; // "lat,lng" or address
}): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', params.origin);
  url.searchParams.set('destination', params.destination);
  if (params.waypoints?.length) {
    url.searchParams.set('waypoints', params.waypoints.join('|'));
  }
  return url.toString();
}

/**
 * Build Apple Maps URL (iOS). Opens in Apple Maps when available.
 */
export function buildAppleMapsUrl(params: {
  origin: string;
  destination: string;
  waypoints?: string[];
}): string {
  const dest = encodeURIComponent(params.destination);
  const origin = encodeURIComponent(params.origin);
  // Apple Maps direction format: daddr (destination), saddr (source)
  const url = `https://maps.apple.com/?daddr=${dest}&saddr=${origin}`;
  return url;
}

/**
 * Open recommended route in external maps app.
 * Prefer Google Maps on Android, Apple Maps on iOS; or let user choose.
 */
export async function openRouteInMaps(params: {
  origin: string;
  destination: string;
  waypoints?: string[];
  preferGoogle?: boolean;
}): Promise<void> {
  const url = (params.preferGoogle ?? false)
    ? buildGoogleMapsUrl(params)
    : buildAppleMapsUrl(params);
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Cannot open maps URL');
  }
  await Linking.openURL(url);
}
