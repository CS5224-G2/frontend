import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import * as Location from 'expo-location';
import MapView, { Marker, type LongPressEvent, type MapPressEvent, type Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardContent, Button } from '../components/native/Common';
import { searchLocations } from '../../services/locationSearchService';
import {
  type AirQualityPreference,
  type CyclistType,
  type ElevationPreference,
  type RouteRecommendationRequest,
  type RouteRequestLocation,
  type ShadePreference,
  type UserPreferences,
} from '../../../../shared/types/index';
import {
  AIR_QUALITY_PREFERENCE_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  ELEVATION_PREFERENCE_OPTIONS,
  POINT_OF_INTEREST_LABELS,
  SHADE_PREFERENCE_OPTIONS,
  getAirQualityPreferenceLabel,
  getElevationPreferenceLabel,
  getShadePreferenceLabel,
  normalizeUserPreferences,
} from '../utils/routePreferences';
import {
  LEGACY_ROUTE_END_STORAGE_KEY,
  LEGACY_ROUTE_START_STORAGE_KEY,
  ROUTE_REQUEST_STORAGE_KEY,
} from '../../services/routeDraftStorage';
import { canUseAndroidMapbox } from '../utils/mapboxSupport';
import { mapPinMarkerProps } from '../utils/mapMarkers';

type Props = NativeStackScreenProps<any, 'RouteConfig'>;
type PickerTarget = { kind: 'start' | 'end' | 'checkpoint'; checkpointId?: string };
type RouteCheckpointInput = RouteRecommendationRequest['checkpoints'][number];

const USER_PREFERENCES_STORAGE_KEY = 'userPreferences';

const cyclistTypes: { type: CyclistType; label: string }[] = [
  { type: 'recreational', label: 'Recreational' },
  { type: 'commuter', label: 'Commuter' },
  { type: 'fitness', label: 'Fitness' },
  { type: 'general', label: 'General' },
];

const defaultMapRegion: Region = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

function formatCoordinates(location?: Pick<RouteRequestLocation, 'lat' | 'lng'> | null) {
  if (!location) {
    return 'No coordinates selected';
  }

  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

function buildCoordinateLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function getSourceLabel(source: RouteRequestLocation['source']) {
  if (source === 'current-location') {
    return 'Current Location';
  }

  if (source === 'map') {
    return 'Map Pin';
  }

  return 'Search Result';
}

function buildLegacyLocation(name: string): RouteRequestLocation {
  return {
    name: name.trim() || 'Saved location',
    lat: defaultMapRegion.latitude,
    lng: defaultMapRegion.longitude,
    source: 'search',
  };
}

function isCoordinateLabel(value: string) {
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(value.trim());
}

function createCheckpointId() {
  return `checkpoint-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function areLocationsIdentical(a: RouteRequestLocation, b: RouteRequestLocation) {
  return a.lat === b.lat && a.lng === b.lng;
}

function buildCurrentLocationLabel(addresses: Location.LocationGeocodedAddress[]) {
  const firstAddress = addresses[0];

  if (!firstAddress) {
    return 'Current location';
  }

  const nameParts = [
    firstAddress.name,
    firstAddress.street,
    firstAddress.district,
    firstAddress.city,
  ].filter(Boolean);

  return nameParts[0] ?? 'Current location';
}

function normalizeCheckpointInput(
  checkpoint: RouteCheckpointInput,
): RouteCheckpointInput {
  return {
    id: checkpoint.id,
    name: checkpoint.name.trim() || buildCoordinateLabel(checkpoint.lat, checkpoint.lng),
    lat: checkpoint.lat,
    lng: checkpoint.lng,
    source: checkpoint.source,
  };
}

function LocationSourceBadge({ location }: { location: RouteRequestLocation }) {
  return (
    <View className="rounded-full bg-blue-50 px-3 py-1 dark:bg-blue-500/15">
      <Text className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">{getSourceLabel(location.source)}</Text>
    </View>
  );
}

function RoutePlannerField({
  title,
  location,
  placeholder,
  hint,
  accent,
  onPress,
}: {
  title: string;
  location: RouteRequestLocation | null;
  placeholder: string;
  hint: string;
  accent: 'default' | 'success';
  onPress?: () => void;
}) {
  const borderClassName =
    accent === 'success'
      ? 'border-emerald-500 dark:border-emerald-400'
      : 'border-slate-300 dark:border-[#2d2d2d]';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`min-h-[88px] justify-center rounded-[8px] border ${borderClassName} bg-white px-4 py-3 dark:bg-[#0f0f0f]`}
      style={({ pressed }) => [pressed && onPress ? { opacity: 0.92 } : null]}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</Text>
          <Text
            className={`mt-1 text-[17px] font-semibold ${
              location ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
            }`}
            numberOfLines={1}
          >
            {location?.name ?? placeholder}
          </Text>
          <Text className="mt-1 text-[13px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {location ? formatCoordinates(location) : hint}
          </Text>
        </View>

        {location ? (
          <LocationSourceBadge location={location} />
        ) : onPress ? (
          <View className="mt-1 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-[#161616]">
            <MaterialCommunityIcons name="chevron-right" size={18} color="#64748b" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function RoutePlannerRail() {
  return (
    <View className="mr-3 w-10 items-center pt-5">
      <View className="h-4 w-4 rounded-full border-4 border-blue-600 bg-white dark:bg-[#0f0f0f]" />
      <View className="my-2 items-center">
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} className="mb-1 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        ))}
      </View>
      <MaterialCommunityIcons name="map-marker" size={26} color="#dc2626" />
    </View>
  );
}

function RoutePlannerActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 min-h-[44px] flex-row items-center justify-center rounded-[8px] border border-slate-300 bg-white px-3 dark:border-[#2d2d2d] dark:bg-[#111111]"
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <MaterialCommunityIcons name={icon} size={16} color="#2563eb" />
      <Text className="ml-2 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{label}</Text>
    </Pressable>
  );
}

function ActionPill({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center rounded-[8px] border border-slate-300 bg-white px-cy-md py-3 dark:border-[#2d2d2d] dark:bg-[#111111]"
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
    >
      <MaterialCommunityIcons name={icon} size={16} color="#2563eb" />
      <Text className="ml-2 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{label}</Text>
    </Pressable>
  );
}

function formatDistanceInputValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

type IconPreferenceOption<T extends string> = {
  value: T;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

function SingleIconTogglePreference<T extends string>({
  title,
  description,
  value,
  onValue,
  offValue,
  onChange,
  icon,
  getLabel,
}: {
  title: string;
  description: string;
  value: T;
  onValue: T;
  offValue: T;
  onChange: (value: T) => void;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  getLabel: (value: T) => string;
}) {
  const isEnabled = value === onValue;

  return (
    <Pressable
      onPress={() => onChange(isEnabled ? offValue : onValue)}
      className={`mb-cy-lg border rounded-[12px] px-cy-md py-cy-md ${
        isEnabled
          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-500/10 dark:border-blue-400'
          : 'border-slate-200 dark:border-[#2d2d2d] bg-white dark:bg-[#0f0f0f]'
      }`}
      style={({ pressed }) => [pressed && { opacity: 0.88, borderColor: '#2563eb' }]}
    >
      <View className="flex-row items-start justify-between gap-cy-sm">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</Text>
          <Text className="mt-1 text-[12px] leading-4 text-slate-500 dark:text-slate-400">{description}</Text>
          <Text className="mt-1 text-[12px] font-semibold text-slate-600 dark:text-slate-300">{getLabel(value)}</Text>
        </View>

        <View
          className={`h-11 w-11 rounded-full items-center justify-center border ${
            isEnabled
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 dark:border-blue-400'
              : 'border-slate-300 dark:border-[#2d2d2d] bg-slate-100 dark:bg-[#111111]'
          }`}
        >
          <MaterialCommunityIcons name={icon} size={20} color={isEnabled ? '#2563eb' : '#64748b'} />
        </View>
      </View>
    </Pressable>
  );
}

function IconPreferenceSelector<T extends string>({
  title,
  description,
  options,
  value,
  onChange,
  getLabel,
}: {
  title: string;
  description: string;
  options: readonly IconPreferenceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
}) {
  return (
    <View className="mb-cy-lg">
      <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100">{title}</Text>
      <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</Text>
      <Text className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{getLabel(value)}</Text>
      <View className="mt-3 flex-row flex-wrap gap-cy-sm">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`border rounded-[12px] px-cy-md py-3 min-w-[108px] items-center justify-center ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 dark:border-blue-400'
                  : 'border-slate-300 dark:border-[#2d2d2d] bg-white dark:bg-[#111111]'
              }`}
              style={({ pressed }) => [pressed && { opacity: 0.85, borderColor: '#2563eb' }]}
            >
              <MaterialCommunityIcons name={option.icon} size={18} color={isSelected ? '#2563eb' : '#64748b'} />
              <Text
                className={`mt-1 text-[12px] font-semibold ${
                  isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {getLabel(option.value)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BinaryPreferenceSlider({
  title,
  value,
  onChange,
  className,
}: {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className={`border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-3 py-3 bg-white dark:bg-[#0f0f0f] ${className ?? ''}`}
      style={({ pressed }) => [pressed && { opacity: 0.88, borderColor: '#2563eb' }]}
    >
      <View className="flex-row items-center justify-between gap-cy-sm">
        <Text className="flex-1 text-[13px] font-semibold text-slate-800 dark:text-slate-100" numberOfLines={2}>
          {title}
        </Text>
        <View
          className={`h-10 w-10 rounded-full items-center justify-center border ${
            value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 dark:border-blue-400'
              : 'border-slate-300 dark:border-[#2d2d2d] bg-slate-100 dark:bg-[#111111]'
          }`}
        >
          <MaterialCommunityIcons name="map-marker-check-outline" size={20} color={value ? '#2563eb' : '#64748b'} />
        </View>
      </View>
      <Text className={`mt-1 text-[11px] font-semibold ${value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
        {value ? 'Included' : 'Not Included'}
      </Text>
    </Pressable>
  );
}

function getPoiCardClassName(index: number) {
  return index % 2 === 0 ? 'w-[48%] mr-[4%] mb-cy-sm' : 'w-[48%] mb-cy-sm';
}

export default function RouteConfigPage({ navigation }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const androidMapboxEnabled = canUseAndroidMapbox();
  const RoutePickerMapbox = androidMapboxEnabled ? require('./RoutePickerMapbox').default : null;

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [maxDistanceInput, setMaxDistanceInput] = useState(formatDistanceInputValue(DEFAULT_USER_PREFERENCES.maxDistanceKm));
  const [startPoint, setStartPoint] = useState<RouteRequestLocation | null>(null);
  const [endPoint, setEndPoint] = useState<RouteRequestLocation | null>(null);
  const [checkpoints, setCheckpoints] = useState<RouteCheckpointInput[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftLocation, setDraftLocation] = useState<RouteRequestLocation | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(defaultMapRegion);
  const [searchResults, setSearchResults] = useState<RouteRequestLocation[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [locatingTargetKind, setLocatingTargetKind] = useState<'start' | 'end' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSavedRouteRequest = async () => {
      try {
        const [savedPreferences, savedRouteRequest, savedStartName, savedEndName] = await Promise.all([
          AsyncStorage.getItem(USER_PREFERENCES_STORAGE_KEY),
          AsyncStorage.getItem(ROUTE_REQUEST_STORAGE_KEY),
          AsyncStorage.getItem(LEGACY_ROUTE_START_STORAGE_KEY),
          AsyncStorage.getItem(LEGACY_ROUTE_END_STORAGE_KEY),
        ]);

        if (savedPreferences) {
          const normalizedPreferences = normalizeUserPreferences(JSON.parse(savedPreferences) as UserPreferences);
          setPreferences(normalizedPreferences);
          setMaxDistanceInput(formatDistanceInputValue(normalizedPreferences.maxDistanceKm));
        }

        if (savedRouteRequest) {
          const parsedRequest = JSON.parse(savedRouteRequest) as RouteRecommendationRequest;
          const normalizedPreferences = normalizeUserPreferences(parsedRequest.preferences);
          setPreferences(normalizedPreferences);
          setMaxDistanceInput(formatDistanceInputValue(normalizedPreferences.maxDistanceKm));
          setStartPoint(parsedRequest.startPoint);
          setEndPoint(parsedRequest.endPoint);
          setCheckpoints((parsedRequest.checkpoints ?? []).map(normalizeCheckpointInput));
          return;
        }

        if (savedStartName) {
          setStartPoint(buildLegacyLocation(savedStartName));
        }

        if (savedEndName) {
          setEndPoint(buildLegacyLocation(savedEndName));
        }
      } catch (error) {
        console.warn('Error loading route config', error);
      }
    };

    loadSavedRouteRequest();
  }, []);

  const shouldSearchLocations = Boolean(
    pickerTarget &&
      searchQuery.trim().length >= 2 &&
      !isCoordinateLabel(searchQuery) &&
      !(draftLocation?.source === 'search' && draftLocation.name === searchQuery.trim()),
  );

  useEffect(() => {
    if (!pickerTarget) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchingLocations(false);
      return;
    }

    if (!shouldSearchLocations) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchingLocations(false);
      return;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearchingLocations(true);
        setSearchError(null);
        const locations = await searchLocations(searchQuery);

        if (!isCancelled) {
          setSearchResults(locations);
        }
      } catch (error) {
        if (!isCancelled) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : 'Unable to search locations right now.');
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingLocations(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [draftLocation?.name, draftLocation?.source, pickerTarget, searchQuery, shouldSearchLocations]);

  const dismissPickerKeyboard = () => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const closePicker = () => {
    dismissPickerKeyboard();
    setPickerTarget(null);
    setSearchQuery('');
    setDraftLocation(null);
    setSearchResults([]);
    setSearchError(null);
    setIsSearchingLocations(false);
  };

  const focusMapRegion = (nextRegion: Region) => {
    setMapRegion(nextRegion);
    if (!androidMapboxEnabled) {
      mapRef.current?.animateToRegion(nextRegion, 250);
    }
  };

  const openPicker = (target: PickerTarget, existingLocation?: RouteRequestLocation | null) => {
    setPickerTarget(target);
    setSearchQuery(existingLocation?.name ?? '');
    setDraftLocation(existingLocation ?? null);

    if (existingLocation) {
      focusMapRegion({
        latitude: existingLocation.lat,
        longitude: existingLocation.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
      return;
    }

    focusMapRegion(defaultMapRegion);
  };

  const applyLocationToTarget = (target: PickerTarget, location: RouteRequestLocation) => {
    if (target.kind === 'start') {
      setStartPoint(location);
      return;
    }

    if (target.kind === 'end') {
      setEndPoint(location);
      return;
    }

    if (target.checkpointId) {
      setCheckpoints((currentCheckpoints) =>
        currentCheckpoints.map((checkpoint) =>
          checkpoint.id === target.checkpointId
            ? {
                ...checkpoint,
                ...location,
              }
            : checkpoint,
        ),
      );
      return;
    }

    setCheckpoints((currentCheckpoints) => [
      ...currentCheckpoints,
      {
        id: createCheckpointId(),
        ...location,
      },
    ]);
  };

  const handleSaveDraftLocation = () => {
    if (!pickerTarget || !draftLocation) {
      Alert.alert('Select a location', 'Choose a search result or tap a point on the map before saving.');
      return;
    }

    applyLocationToTarget(pickerTarget, {
      ...draftLocation,
      name: searchQuery.trim() || draftLocation.name,
    });
    closePicker();
  };

  const updateDraftLocation = (latitude: number, longitude: number) => {
    dismissPickerKeyboard();
    const coordinateLabel = buildCoordinateLabel(latitude, longitude);
    const nextLocation: RouteRequestLocation = {
      name: coordinateLabel,
      lat: latitude,
      lng: longitude,
      source: 'map',
    };

    setDraftLocation(nextLocation);
    setSearchQuery(coordinateLabel);
    focusMapRegion({
      latitude: nextLocation.lat,
      longitude: nextLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const handleMapPress = (event: MapPressEvent) => {
    updateDraftLocation(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude);
  };

  const handleMapLongPress = (event: LongPressEvent) => {
    updateDraftLocation(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude);
  };

  const handleUseCurrentLocation = async (target: PickerTarget) => {
    if (target.kind !== 'start' && target.kind !== 'end') {
      return;
    }

    try {
      setLocatingTargetKind(target.kind);
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Location access needed', 'Enable location permission to use your current position.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const resolvedAddresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }).catch(() => []);

      applyLocationToTarget(target, {
        name: buildCurrentLocationLabel(resolvedAddresses),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        source: 'current-location',
      });
    } catch (error) {
      console.warn('Unable to resolve current location', error);
      Alert.alert('Location unavailable', 'The app could not read your current location right now.');
    } finally {
      setLocatingTargetKind(null);
    }
  };

  const handleConfirm = async () => {
    if (!startPoint || !endPoint) {
      Alert.alert('Missing route points', 'Select both a start point and an end point before continuing.');
      return;
    }

    if (areLocationsIdentical(startPoint, endPoint)) {
      Alert.alert(
        'Invalid route points',
        'Choose different locations for the start point and end point before continuing.',
      );
      return;
    }

    const parsedMaxDistance = Number(maxDistanceInput);
    if (!Number.isFinite(parsedMaxDistance) || parsedMaxDistance <= 0) {
      Alert.alert('Invalid max distance', 'Enter a valid max distance in kilometers before continuing.');
      return;
    }

    const nextPreferences = normalizeUserPreferences({
      ...preferences,
      maxDistanceKm: parsedMaxDistance,
    });

    const routeRequest: RouteRecommendationRequest = {
      startPoint,
      endPoint,
      checkpoints,
      preferences: nextPreferences,
      limit: 3,
    };

    try {
      setIsSubmitting(true);
      setPreferences(nextPreferences);
      await Promise.all([
        AsyncStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences)),
        AsyncStorage.setItem(ROUTE_REQUEST_STORAGE_KEY, JSON.stringify(routeRequest)),
        AsyncStorage.setItem(LEGACY_ROUTE_START_STORAGE_KEY, startPoint.name),
        AsyncStorage.setItem(LEGACY_ROUTE_END_STORAGE_KEY, endPoint.name),
      ]);
      navigation.navigate('Recommendation');
    } catch (error) {
      console.warn('Error saving route config', error);
      Alert.alert('Error', 'Unable to save route configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-[#F8FAFC] dark:bg-[#1a1a1a]"
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 12) + 96 }}
      >
          <View className="mb-4">
          <Text className="text-[28px] font-semibold text-slate-900 dark:text-slate-100">Configure Custom Route</Text>
          <Text className="mt-2 text-[14px] leading-5 text-slate-500 dark:text-slate-400">
            Set your start, destination, and optional stops first. Then tune the ride preferences underneath.
          </Text>
        </View>

        <View className="mb-5 rounded-[8px] border border-slate-200 bg-white px-4 py-4 dark:border-[#2d2d2d] dark:bg-[#0f0f0f]">
          <View className="flex-row">
            <RoutePlannerRail />

            <View className="flex-1">
              <RoutePlannerField
                title="Start point"
                location={startPoint}
                placeholder="Use current location"
                hint="Search on map or locate your pickup"
                accent="default"
                onPress={() => openPicker({ kind: 'start' }, startPoint)}
              />

              <View className="mt-3 flex-row gap-2">
                <RoutePlannerActionButton
                  label={locatingTargetKind === 'start' ? 'Locating...' : 'Use Current Location'}
                  icon="crosshairs-gps"
                  onPress={() => handleUseCurrentLocation({ kind: 'start' })}
                />
                <RoutePlannerActionButton
                  label="Search on Map"
                  icon="map-search-outline"
                  onPress={() => openPicker({ kind: 'start' }, startPoint)}
                />
              </View>

              <View className="mt-4">
                <RoutePlannerField
                  title="End point"
                  location={endPoint}
                  placeholder="Choose destination"
                  hint="Search on map or locate a drop-off"
                  accent="success"
                  onPress={() => openPicker({ kind: 'end' }, endPoint)}
                />
              </View>

              <View className="mt-3 flex-row gap-2">
                <RoutePlannerActionButton
                  label={locatingTargetKind === 'end' ? 'Locating...' : 'Use Current Location'}
                  icon="crosshairs-gps"
                  onPress={() => handleUseCurrentLocation({ kind: 'end' })}
                />
                <RoutePlannerActionButton
                  label="Search on Map"
                  icon="map-search-outline"
                  onPress={() => openPicker({ kind: 'end' }, endPoint)}
                />
              </View>
            </View>
          </View>

          <View className="mt-5 border-t border-slate-200 pt-4 dark:border-[#2d2d2d]">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100">Checkpoints</Text>
                <Text className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                  Add optional stops before generating route recommendations.
                </Text>
              </View>

              <View className="w-[148px]">
                <ActionPill label="Add Checkpoint" icon="map-plus" onPress={() => openPicker({ kind: 'checkpoint' })} />
              </View>
            </View>

            <View className="mt-4 gap-cy-sm">
              {checkpoints.length === 0 ? (
                <View className="rounded-[8px] border border-dashed border-slate-300 bg-slate-50 px-cy-md py-cy-md dark:border-[#2d2d2d] dark:bg-[#111111]">
                  <Text className="text-[14px] text-slate-500 dark:text-slate-400">No checkpoints added yet.</Text>
                </View>
              ) : (
                checkpoints.map((checkpoint, index) => (
                  <View key={checkpoint.id} className="rounded-[8px] border border-slate-200 bg-slate-50 px-cy-md py-cy-md dark:border-[#2d2d2d] dark:bg-[#111111]">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Checkpoint {index + 1}
                        </Text>
                        <Text className="mt-1 text-[15px] font-semibold text-slate-800 dark:text-slate-100">{checkpoint.name}</Text>
                        <Text className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{formatCoordinates(checkpoint)}</Text>
                      </View>

                      <LocationSourceBadge location={checkpoint} />
                    </View>

                    <View className="mt-cy-md flex-row gap-cy-sm">
                      <ActionPill label="Edit on Map" icon="map-marker-radius" onPress={() => openPicker({ kind: 'checkpoint', checkpointId: checkpoint.id }, checkpoint)} />
                    </View>

                    <Pressable
                      onPress={() => setCheckpoints((currentCheckpoints) => currentCheckpoints.filter((item) => item.id !== checkpoint.id))}
                      className="mt-cy-md items-center py-2"
                      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                    >
                      <Text className="text-[13px] font-semibold text-rose-600 dark:text-rose-400">Delete checkpoint</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <Card>
          <CardContent>
            <View className="mb-cy-lg">
              <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100 mb-2">Cyclist Type</Text>
              <View className="flex-row flex-wrap gap-cy-sm">
                {cyclistTypes.map((option) => (
                  <Pressable
                    key={option.type}
                    onPress={() =>
                      setPreferences((currentPreferences) =>
                        normalizeUserPreferences({ ...currentPreferences, cyclistType: option.type }),
                      )
                    }
                    className={`border rounded-[10px] py-2 px-cy-md mr-2 mb-2 ${
                      preferences.cyclistType === option.type
                        ? 'bg-[#2563eb] dark:bg-blue-500 border-[#2563eb] dark:border-blue-500'
                        : 'bg-white dark:bg-[#111111] border-slate-300 dark:border-[#2d2d2d]'
                    }`}
                  >
                    <Text
                      className={`text-[13px] ${
                        preferences.cyclistType === option.type ? 'text-white' : 'text-slate-700 dark:text-slate-100'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <SingleIconTogglePreference<ShadePreference>
              title="Shade Preference"
              description="Tap to switch between muted and reduce shade."
              value={preferences.shadePreference}
              onValue={SHADE_PREFERENCE_OPTIONS[0]}
              offValue={SHADE_PREFERENCE_OPTIONS[1]}
              icon="weather-sunny-alert"
              onChange={(shadePreference) =>
                setPreferences((currentPreferences) =>
                  normalizeUserPreferences({ ...currentPreferences, shadePreference }),
                )
              }
              getLabel={getShadePreferenceLabel}
            />

            <SingleIconTogglePreference<AirQualityPreference>
              title="Air Quality"
              description="Tap to switch between care and muted."
              value={preferences.airQualityPreference}
              onValue={AIR_QUALITY_PREFERENCE_OPTIONS[0]}
              offValue={AIR_QUALITY_PREFERENCE_OPTIONS[1]}
              icon="air-filter"
              onChange={(airQualityPreference) =>
                setPreferences((currentPreferences) =>
                  normalizeUserPreferences({ ...currentPreferences, airQualityPreference }),
                )
              }
              getLabel={getAirQualityPreferenceLabel}
            />

            <IconPreferenceSelector<ElevationPreference>
              title="Elevation Preference"
              description="Tell the recommender whether you want flatter routes, steeper climbs, or no elevation preference."
              options={[
                { value: ELEVATION_PREFERENCE_OPTIONS[0], icon: 'trending-down' },
                { value: ELEVATION_PREFERENCE_OPTIONS[1], icon: 'swap-horizontal' },
                { value: ELEVATION_PREFERENCE_OPTIONS[2], icon: 'trending-up' },
              ]}
              value={preferences.elevationPreference}
              onChange={(elevationPreference) =>
                setPreferences((currentPreferences) =>
                  normalizeUserPreferences({ ...currentPreferences, elevationPreference }),
                )
              }
              getLabel={getElevationPreferenceLabel}
            />

            <View className="mb-cy-lg">
              <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100">Max Distance</Text>
              <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Type the furthest distance you want the backend to consider for this ride.
              </Text>
              <View className="mt-3 flex-row items-center border border-slate-300 dark:border-[#2d2d2d] rounded-[14px] bg-white dark:bg-[#111111] px-cy-md">
                <TextInput
                  className="flex-1 py-3 text-[16px] text-slate-900 dark:text-slate-100"
                  value={maxDistanceInput}
                  onChangeText={(value) => {
                    const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setMaxDistanceInput(sanitizedValue);

                    const parsedValue = Number(sanitizedValue);
                    if (Number.isFinite(parsedValue) && parsedValue > 0) {
                      setPreferences((currentPreferences) =>
                        normalizeUserPreferences({
                          ...currentPreferences,
                          maxDistanceKm: parsedValue,
                        }),
                      );
                    }
                  }}
                  onBlur={() => {
                    const parsedValue = Number(maxDistanceInput);
                    if (Number.isFinite(parsedValue) && parsedValue > 0) {
                      setMaxDistanceInput(formatDistanceInputValue(parsedValue));
                    }
                  }}
                  placeholder="Enter max distance"
                  placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
                  keyboardType="decimal-pad"
                />
                <Text className="ml-3 text-sm font-semibold text-slate-500 dark:text-slate-400">km</Text>
              </View>
            </View>

            <View className="mb-cy-lg gap-cy-sm">
              <View>
                <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100">Points of Interest</Text>
                <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Select the categories you want the backend to route past. When selected, the request will ask for the nearest matching point of interest along the ride.
                </Text>
              </View>

              <View className="flex-row flex-wrap">
              {(Object.keys(POINT_OF_INTEREST_LABELS) as Array<keyof typeof POINT_OF_INTEREST_LABELS>).map((poiKey, index) => (
                <BinaryPreferenceSlider
                  key={poiKey}
                  title={POINT_OF_INTEREST_LABELS[poiKey]}
                  value={preferences.pointsOfInterest[poiKey]}
                  className={getPoiCardClassName(index)}
                  onChange={(selected) =>
                    setPreferences((currentPreferences) =>
                      normalizeUserPreferences({
                        ...currentPreferences,
                        pointsOfInterest: {
                          ...currentPreferences.pointsOfInterest,
                          [poiKey]: selected,
                        },
                      }),
                    )
                  }
                />
              ))}
              </View>
            </View>

            <Button onPress={handleConfirm} loading={isSubmitting}>Find Routes</Button>
          </CardContent>
        </Card>
      </ScrollView>

      <Modal visible={Boolean(pickerTarget)} animationType="slide" onRequestClose={closePicker}>
        <View
          className="flex-1 bg-slate-50 dark:bg-black px-4"
          style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-start justify-between mb-cy-md">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {pickerTarget?.kind === 'start'
                  ? 'Select Start Point'
                  : pickerTarget?.kind === 'end'
                    ? 'Select End Point'
                    : 'Checkpoint Details'}
              </Text>
              <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Search like a map app to jump to a place, or tap anywhere to drop a pin. The saved coordinates will be used in the mock backend payload.
              </Text>
            </View>

            <Pressable onPress={closePicker} className="px-2 py-2" style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
              <MaterialCommunityIcons name="close" size={22} color={isDark ? '#f8fafc' : '#0f172a'} />
            </Pressable>
          </View>

          <View className="mt-cy-sm flex-1">
            <View className="overflow-hidden rounded-[16px] border border-slate-200 dark:border-[#2d2d2d] flex-1 min-h-[420px] bg-white dark:bg-[#0f0f0f]">
              {androidMapboxEnabled && RoutePickerMapbox ? (
                <RoutePickerMapbox
                  region={mapRegion}
                  draftLocation={draftLocation}
                  onSelectCoordinate={updateDraftLocation}
                />
              ) : (
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={mapRegion}
                  zoomEnabled
                  zoomTapEnabled
                  scrollEnabled
                  rotateEnabled={false}
                  pitchEnabled={false}
                  onPress={handleMapPress}
                  onLongPress={handleMapLongPress}
                >
                  {draftLocation ? (
                    <Marker
                      coordinate={{ latitude: draftLocation.lat, longitude: draftLocation.lng }}
                      title={searchQuery.trim() || draftLocation.name}
                      description="Tap elsewhere on the map to move this pin."
                      {...mapPinMarkerProps()}
                    />
                  ) : null}
                </MapView>
              )}

              <View className="absolute left-3 right-3 top-3" pointerEvents="box-none">
                <TextInput
                  ref={searchInputRef}
                  className="border border-slate-300 dark:border-[#2d2d2d] rounded-[14px] px-cy-md bg-white dark:bg-[#111111] text-slate-900 dark:text-slate-100"
                  style={{ height: 50 }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={dismissPickerKeyboard}
                  placeholder="Search places with OneMap or drop a pin"
                  placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
                  autoCapitalize="words"
                  blurOnSubmit
                  returnKeyType="search"
                />

                {searchQuery.trim() ? (
                  <View className="mt-2 rounded-[14px] border border-slate-200 dark:border-[#2d2d2d] bg-white dark:bg-[#111111] overflow-hidden">
                    {isSearchingLocations ? (
                      <View className="px-cy-md py-3">
                        <Text className="text-[13px] text-slate-500 dark:text-slate-400">Searching OneMap...</Text>
                      </View>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((location, index) => (
                        <Pressable
                          key={`${location.name}-${location.lat}-${location.lng}`}
                          onPress={() => {
                            dismissPickerKeyboard();
                            setDraftLocation(location);
                            setSearchQuery(location.name);
                            setSearchResults([]);
                            setSearchError(null);
                            focusMapRegion({
                              latitude: location.lat,
                              longitude: location.lng,
                              latitudeDelta: 0.05,
                              longitudeDelta: 0.05,
                            });
                          }}
                          className={`px-cy-md py-3 ${index < searchResults.length - 1 ? 'border-b border-slate-200 dark:border-[#2d2d2d]' : ''}`}
                          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                        >
                          <Text className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{location.name}</Text>
                          <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{formatCoordinates(location)}</Text>
                        </Pressable>
                      ))
                    ) : searchError ? (
                      <View className="px-cy-md py-3">
                        <Text className="text-[13px] text-amber-700 dark:text-amber-300">{searchError}</Text>
                      </View>
                    ) : (
                      <View className="px-cy-md py-3">
                        <Text className="text-[13px] text-slate-500 dark:text-slate-400">
                          No place match. Tap the map to drop a pin at a custom coordinate.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            </View>

            <View className="mt-cy-md border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
              <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected Location</Text>
              <Text className="text-[14px] font-semibold text-slate-800 dark:text-slate-100 mt-1">
                {draftLocation?.name || 'Drop a pin on the map'}
              </Text>
              <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                {draftLocation ? formatCoordinates(draftLocation) : 'Tap the map to create a pin or choose a search result.'}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-cy-sm mt-cy-md">
            <View className="flex-1">
              <Button onPress={closePicker} variant="secondary">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: isDark ? '#ffffff' : '#000000' }}
                >
                  Cancel
                </Text>
              </Button>
            </View>
            <View className="flex-1">
              <Button onPress={handleSaveDraftLocation} disabled={!draftLocation}>Save Location</Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
