import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useColorScheme } from 'nativewind';
import * as Location from 'expo-location';
import MapView, { Marker, type LongPressEvent, type MapPressEvent, type Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '../components/native/Common';
import { searchLocations } from '../../services/locationSearchService';
import {
  type CyclistType,
  type RouteRecommendationRequest,
  type RouteRequestLocation,
  type UserPreferences,
} from '../../../../shared/types/index';

type Props = NativeStackScreenProps<any, 'RouteConfig'>;
type PickerTarget = { kind: 'start' | 'end' | 'checkpoint'; checkpointId?: string };
type RouteCheckpointInput = RouteRecommendationRequest['checkpoints'][number];

const ROUTE_REQUEST_STORAGE_KEY = 'routeRecommendationRequest';
const USER_PREFERENCES_STORAGE_KEY = 'userPreferences';
const LEGACY_ROUTE_START_STORAGE_KEY = 'routeStartPoint';
const LEGACY_ROUTE_END_STORAGE_KEY = 'routeEndPoint';

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

function LocationValueCard({
  title,
  location,
}: {
  title: string;
  location: RouteRequestLocation | null;
}) {
  return (
    <View className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
        {location ? (
          <View className="bg-blue-50 dark:bg-blue-500/15 rounded-full px-3 py-1">
            <Text className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">{getSourceLabel(location.source)}</Text>
          </View>
        ) : null}
      </View>

      <Text className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
        {location?.name ?? 'No location selected'}
      </Text>
      <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
        {formatCoordinates(location)}
      </Text>
    </View>
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
      className="border border-slate-300 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-3 bg-white dark:bg-[#111111] flex-row items-center justify-center"
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
    >
      <MaterialCommunityIcons name={icon} size={16} color="#2563eb" />
      <Text className="ml-2 text-[13px] font-semibold text-slate-700 dark:text-slate-100">{label}</Text>
    </Pressable>
  );
}

export default function RouteConfigPage({ navigation }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mapRef = useRef<MapView | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>({
    cyclistType: 'general',
    preferredShade: 50,
    elevation: 50,
    distance: 10,
    airQuality: 50,
  });
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
  const [isLocating, setIsLocating] = useState(false);
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
          setPreferences(JSON.parse(savedPreferences) as UserPreferences);
        }

        if (savedRouteRequest) {
          const parsedRequest = JSON.parse(savedRouteRequest) as RouteRecommendationRequest;
          setStartPoint(parsedRequest.startPoint);
          setEndPoint(parsedRequest.endPoint);
          setCheckpoints(parsedRequest.checkpoints ?? []);
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

  const closePicker = () => {
    setPickerTarget(null);
    setSearchQuery('');
    setDraftLocation(null);
    setSearchResults([]);
    setSearchError(null);
    setIsSearchingLocations(false);
  };

  const focusMapRegion = (nextRegion: Region) => {
    setMapRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 250);
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
          checkpoint.id === target.checkpointId ? { ...checkpoint, ...location } : checkpoint,
        ),
      );
      return;
    }

    setCheckpoints((currentCheckpoints) => [...currentCheckpoints, { id: createCheckpointId(), ...location }]);
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
    try {
      setIsLocating(true);
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
      setIsLocating(false);
    }
  };

  const handleConfirm = async () => {
    if (!startPoint || !endPoint) {
      Alert.alert('Missing route points', 'Select both a start point and an end point before continuing.');
      return;
    }

    const routeRequest: RouteRecommendationRequest = {
      startPoint,
      endPoint,
      checkpoints,
      preferences,
    };

    try {
      setIsSubmitting(true);
      await Promise.all([
        AsyncStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences)),
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
      <ScrollView className="flex-1 bg-[#F8FAFC] dark:bg-[#1a1a1a]" contentContainerStyle={{ padding: 16, paddingBottom: 70 }}>
        <Card>
          <CardHeader>
            <CardTitle>Configure Custom Route</CardTitle>
            <CardDescription>
              Build the request payload now and hand it off to the recommendation screen while the backend API is still mocked.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <View className="gap-cy-sm">
              <LocationValueCard title="Start Point" location={startPoint} />
              <View className="gap-cy-sm">
                <ActionPill label={isLocating ? 'Locating...' : 'Use Current Location'} icon="crosshairs-gps" onPress={() => handleUseCurrentLocation({ kind: 'start' })} />
                <ActionPill label="Search on Map" icon="map-search-outline" onPress={() => openPicker({ kind: 'start' }, startPoint)} />
              </View>
            </View>

            <View className="gap-cy-sm">
              <LocationValueCard title="End Point" location={endPoint} />
              <View className="gap-cy-sm">
                <ActionPill label={isLocating ? 'Locating...' : 'Use Current Location'} icon="crosshairs-gps" onPress={() => handleUseCurrentLocation({ kind: 'end' })} />
                <ActionPill label="Search on Map" icon="map-search-outline" onPress={() => openPicker({ kind: 'end' }, endPoint)} />
              </View>
            </View>

            <View className="gap-cy-sm">
              <View>
                <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100">Checkpoints</Text>
                <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                  Add as many optional stops as needed, then edit or remove them before submitting.
                </Text>
              </View>

              {checkpoints.length === 0 ? (
                <View className="border border-dashed border-slate-300 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
                  <Text className="text-[14px] text-slate-500 dark:text-slate-400">No checkpoints added yet.</Text>
                </View>
              ) : (
                checkpoints.map((checkpoint, index) => (
                  <View key={checkpoint.id} className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Checkpoint {index + 1}
                        </Text>
                        <Text className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mt-1">{checkpoint.name}</Text>
                        <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{formatCoordinates(checkpoint)}</Text>
                      </View>

                      <View className="bg-blue-50 dark:bg-blue-500/15 rounded-full px-3 py-1">
                        <Text className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">{getSourceLabel(checkpoint.source)}</Text>
                      </View>
                    </View>

                    <View className="flex-row gap-cy-sm mt-cy-md">
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

              <View className="gap-cy-sm">
                <ActionPill label="Add Checkpoint" icon="map-plus" onPress={() => openPicker({ kind: 'checkpoint' })} />
              </View>
            </View>

            <View className="mb-cy-lg">
              <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100 mb-2">Cyclist Type</Text>
              <View className="flex-row flex-wrap gap-cy-sm">
                {cyclistTypes.map((option) => (
                  <Pressable
                    key={option.type}
                    onPress={() => setPreferences({ ...preferences, cyclistType: option.type })}
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

            <View className="mb-cy-lg">
              <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">Preferred Shade: {preferences.preferredShade}%</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                value={preferences.preferredShade}
                onValueChange={(value) => setPreferences({ ...preferences, preferredShade: value })}
                minimumValue={0}
                maximumValue={100}
                step={10}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#d1d5db"
              />
            </View>

            <View className="mb-cy-lg">
              <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">Elevation Challenge: {preferences.elevation}%</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                value={preferences.elevation}
                onValueChange={(value) => setPreferences({ ...preferences, elevation: value })}
                minimumValue={0}
                maximumValue={100}
                step={10}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#d1d5db"
              />
            </View>

            <View className="mb-cy-lg">
              <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">Preferred Distance: {preferences.distance} km</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                value={preferences.distance}
                onValueChange={(value) => setPreferences({ ...preferences, distance: value })}
                minimumValue={5}
                maximumValue={50}
                step={5}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#d1d5db"
              />
            </View>

            <View className="mb-cy-lg">
              <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">Minimum Air Quality: {preferences.airQuality}%</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                value={preferences.airQuality}
                onValueChange={(value) => setPreferences({ ...preferences, airQuality: value })}
                minimumValue={0}
                maximumValue={100}
                step={10}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#d1d5db"
              />
            </View>

            <Button onPress={handleConfirm} loading={isSubmitting}>Find Routes</Button>
          </CardContent>
        </Card>

        <Pressable onPress={() => navigation.goBack()} className="mt-[14px] items-center">
          <Text className="text-[#2563eb] dark:text-blue-400 font-bold">Back</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={Boolean(pickerTarget)} animationType="slide" onRequestClose={closePicker}>
        <View className="flex-1 bg-slate-50 dark:bg-black px-4 pt-5 pb-8">
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
                  />
                ) : null}
              </MapView>

              <View className="absolute left-3 right-3 top-3" pointerEvents="box-none">
                <TextInput
                  className="border border-slate-300 dark:border-[#2d2d2d] rounded-[14px] px-cy-md bg-white dark:bg-[#111111] text-slate-900 dark:text-slate-100"
                  style={{ height: 50 }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search places with OneMap or drop a pin"
                  placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
                  autoCapitalize="words"
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
                            setDraftLocation(location);
                            setSearchQuery(location.name);
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
                          No Google place match. Tap the map to drop a pin at a custom coordinate.
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
