import type {
  AirQualityPreference,
  ElevationPreference,
  PointOfInterestPreferences,
  ShadePreference,
  UserPreferences,
} from '../../../../shared/types/index';

export const SHADE_PREFERENCE_OPTIONS: ShadePreference[] = ['reduce-shade', 'dont-care'];
export const ELEVATION_PREFERENCE_OPTIONS: ElevationPreference[] = ['lower', 'dont-care', 'higher'];
export const AIR_QUALITY_PREFERENCE_OPTIONS: AirQualityPreference[] = ['care', 'dont-care'];

export const DEFAULT_POINTS_OF_INTEREST: PointOfInterestPreferences = {
  hawkerCenter: false,
  historicSite: false,
  park: false,
  touristAttraction: false,
};

export const POINT_OF_INTEREST_LABELS: Record<keyof PointOfInterestPreferences, string> = {
  hawkerCenter: 'Hawker center',
  historicSite: 'Historic site',
  park: 'Parks',
  touristAttraction: 'Tourist attraction',
};

const LEGACY_SHADE_VALUES: Record<ShadePreference, number> = {
  'reduce-shade': 80,
  'dont-care': 50,
};

const LEGACY_ELEVATION_VALUES: Record<ElevationPreference, number> = {
  lower: 20,
  'dont-care': 50,
  higher: 80,
};

const LEGACY_AIR_QUALITY_VALUES: Record<AirQualityPreference, number> = {
  care: 70,
  'dont-care': 0,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  cyclistType: 'general',
  preferredShade: LEGACY_SHADE_VALUES['dont-care'],
  elevation: LEGACY_ELEVATION_VALUES['dont-care'],
  distance: 10,
  airQuality: LEGACY_AIR_QUALITY_VALUES['care'],
  shadePreference: 'dont-care',
  elevationPreference: 'dont-care',
  maxDistanceKm: 10,
  airQualityPreference: 'care',
  pointsOfInterest: DEFAULT_POINTS_OF_INTEREST,
};

function inferShadePreference(preferredShade?: number): ShadePreference {
  return typeof preferredShade === 'number' && preferredShade >= 60 ? 'reduce-shade' : 'dont-care';
}

function inferElevationPreference(elevation?: number): ElevationPreference {
  if (typeof elevation !== 'number') {
    return 'dont-care';
  }

  if (elevation <= 35) {
    return 'lower';
  }

  if (elevation >= 65) {
    return 'higher';
  }

  return 'dont-care';
}

function inferAirQualityPreference(airQuality?: number): AirQualityPreference {
  return typeof airQuality === 'number' && airQuality > 0 ? 'care' : 'dont-care';
}

export function getShadePreferenceLabel(value: ShadePreference): string {
  return value === 'reduce-shade' ? 'Reduce shade' : "Don't care";
}

export function getElevationPreferenceLabel(value: ElevationPreference): string {
  if (value === 'lower') {
    return 'Lower';
  }

  if (value === 'higher') {
    return 'Higher';
  }

  return "Don't care";
}

export function getAirQualityPreferenceLabel(value: AirQualityPreference): string {
  return value === 'care' ? 'Care' : "Don't care";
}

export function normalizeUserPreferences(
  value?: Partial<UserPreferences> | null,
): UserPreferences {
  const shadePreference = value?.shadePreference ?? inferShadePreference(value?.preferredShade);
  const elevationPreference = value?.elevationPreference ?? inferElevationPreference(value?.elevation);
  const maxDistanceKm =
    typeof value?.maxDistanceKm === 'number'
      ? value.maxDistanceKm
      : typeof value?.distance === 'number'
        ? value.distance
        : DEFAULT_USER_PREFERENCES.maxDistanceKm;
  const airQualityPreference =
    value?.airQualityPreference ?? inferAirQualityPreference(value?.airQuality);

  return {
    cyclistType: value?.cyclistType ?? DEFAULT_USER_PREFERENCES.cyclistType,
    preferredShade: LEGACY_SHADE_VALUES[shadePreference],
    elevation: LEGACY_ELEVATION_VALUES[elevationPreference],
    distance: maxDistanceKm,
    airQuality: LEGACY_AIR_QUALITY_VALUES[airQualityPreference],
    shadePreference,
    elevationPreference,
    maxDistanceKm,
    airQualityPreference,
    pointsOfInterest: {
      ...DEFAULT_POINTS_OF_INTEREST,
      ...(value?.pointsOfInterest ?? {}),
    },
  };
}

export function hasSelectedPointsOfInterest(pointsOfInterest: PointOfInterestPreferences): boolean {
  return Object.values(pointsOfInterest).some(Boolean);
}

export function getSelectedPointOfInterestLabels(
  pointsOfInterest: PointOfInterestPreferences,
): string[] {
  return Object.entries(pointsOfInterest)
    .filter(([, isSelected]) => isSelected)
    .map(([key]) => POINT_OF_INTEREST_LABELS[key as keyof PointOfInterestPreferences]);
}

export function getSelectedPointOfInterestKeys(
  pointsOfInterest: PointOfInterestPreferences,
): Array<keyof PointOfInterestPreferences> {
  return Object.entries(pointsOfInterest)
    .filter(([, isSelected]) => isSelected)
    .map(([key]) => key as keyof PointOfInterestPreferences);
}