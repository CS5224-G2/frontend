import * as Location from 'expo-location';

import {
  formatAddressFromGeocode,
  isCoordinatePlaceholderName,
  reverseGeocodePlaceLabel,
} from './placeGeocode';

describe('isCoordinatePlaceholderName', () => {
  it('treats empty and unknown labels as placeholders', () => {
    expect(isCoordinatePlaceholderName('')).toBe(true);
    expect(isCoordinatePlaceholderName('   ')).toBe(true);
    expect(isCoordinatePlaceholderName('Unknown start')).toBe(true);
    expect(isCoordinatePlaceholderName('unknown end')).toBe(true);
  });

  it('detects degree coordinate strings from finalizeRouteEndpoints', () => {
    expect(isCoordinatePlaceholderName('1.3521°, 103.8198°')).toBe(true);
    expect(isCoordinatePlaceholderName('-40.7829°, -73.9654°')).toBe(true);
  });

  it('detects plain lat,lng pairs', () => {
    expect(isCoordinatePlaceholderName('1.3521, 103.8198')).toBe(true);
  });

  it('keeps real place names', () => {
    expect(isCoordinatePlaceholderName('Marina Bay Sands')).toBe(false);
    expect(isCoordinatePlaceholderName('Central Park South')).toBe(false);
  });
});

describe('formatAddressFromGeocode', () => {
  it('builds a readable line from the first address', () => {
    const line = formatAddressFromGeocode([
      {
        name: 'Orchard Rd',
        street: 'Orchard Road',
        district: 'Orchard',
        city: 'Singapore',
        region: null,
        subregion: null,
        postalCode: null,
        isoCountryCode: null,
        country: null,
        timezone: null,
        formattedAddress: null,
      } as Location.LocationGeocodedAddress,
    ]);
    expect(line).toContain('Orchard');
  });
});

describe('reverseGeocodePlaceLabel', () => {
  beforeEach(() => {
    (Location.reverseGeocodeAsync as jest.Mock).mockReset();
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);
  });

  it('returns null when geocoder returns nothing', async () => {
    await expect(reverseGeocodePlaceLabel(1.3, 103.8)).resolves.toBeNull();
  });

  it('returns formatted line when geocoder succeeds', async () => {
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce([
      {
        name: 'Test Plaza',
        street: null,
        district: 'Downtown',
        city: 'Singapore',
        region: null,
        subregion: null,
        postalCode: null,
        isoCountryCode: null,
        country: null,
        timezone: null,
        formattedAddress: null,
      },
    ]);
    await expect(reverseGeocodePlaceLabel(1.29, 103.85)).resolves.toBe('Test Plaza, Downtown, Singapore');
  });
});
