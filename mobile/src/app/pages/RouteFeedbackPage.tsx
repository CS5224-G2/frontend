import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { type Route } from '../../../../shared/types/index';
import { submitRideFeedback } from '../../services/rideService';
import { resolveRouteById } from '../../services/routeLookup';
import { useFloatingTabBarScrollPadding } from '../utils/floatingTabBarInset';
import { getUserProfile, type UserProfile } from '../../services/userService';
import { getProfileAvatarSource } from '../utils/profileAvatar';

type Props = NativeStackScreenProps<any, any>;

export default function RouteFeedbackPage({ navigation, route }: Props) {
  const routeParam = route.params?.route as Route | undefined;
  const routeId = (route.params?.routeId as string | undefined) ?? routeParam?.id ?? '1';
  const rideSummary = route.params?.rideSummary as
    | {
        distanceKm: number;
        elapsedMinutes: number;
        checkpointsVisited: number;
      }
    | undefined;
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [routeData, setRouteData] = useState<Route | null>(routeParam ?? null);
  const [isLoading, setIsLoading] = useState(!routeParam);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollBottomPad = useFloatingTabBarScrollPadding(20);

  useEffect(() => {
    let cancelled = false;

    getUserProfile()
      .then((nextProfile) => {
        if (nextProfile.avatarUrl && typeof Image.prefetch === 'function') {
          Promise.resolve(Image.prefetch(nextProfile.avatarUrl)).catch(() => {});
        }

        if (!cancelled) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!routeId) {
        if (!cancelled) {
          setRouteData(routeParam ?? null);
          setIsLoading(false);
        }
        return;
      }

      if (!routeParam) {
        setIsLoading(true);
      }

      const resolvedRoute = await resolveRouteById(routeId);
      if (!cancelled) {
        setRouteData(resolvedRoute ?? routeParam ?? null);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const avatarSource = useMemo(
    () => getProfileAvatarSource(profile?.avatarUrl),
    [profile?.avatarUrl]
  );
  const avatarInitials = useMemo(() => {
    if (!profile?.fullName) {
      return '?';
    }

    return profile.fullName
      .trim()
      .split(/\s+/)
      .filter((namePart) => namePart.length > 0)
      .map((namePart) => namePart[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profile?.fullName]);
  const firstName = useMemo(() => profile?.fullName?.split(' ')[0] ?? null, [profile?.fullName]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await submitRideFeedback({ routeId, rating, review: feedback });
      setSubmitted(true);
      setTimeout(() => {
        navigation.navigate('HomePage');
      }, 2000);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not submit feedback. Check your connection and try again.';
      Alert.alert('Submission failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-[#f9fafb] dark:bg-black">
        <View className="flex-1 justify-center items-center p-[32px]">
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#1D4ED8'} />
        </View>
      </ScrollView>
    );
  }

  if (!routeData) {
    return (
      <ScrollView className="flex-1 bg-[#f9fafb] dark:bg-black">
        <View className="p-cy-lg pt-10">
          <Text className="text-[28px] font-bold text-[#1e293b] dark:text-slate-100 text-center">Route not found</Text>
          <Pressable className="bg-[#3b82f6] rounded-cy-md p-cy-md items-center mt-cy-lg" onPress={() => navigation.navigate('HomePage')}>
            <Text className="text-white text-base">Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (submitted) {
    return (
      <ScrollView className="flex-1 bg-[#f9fafb] dark:bg-black">
        <View className="flex-1 justify-center items-center p-[32px]">
          <View className="mb-[24px]">
            <MaterialCommunityIcons name="check-circle" size={48} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-[#1e293b] dark:text-slate-100 mb-2">Thank You!</Text>
          <Text className="text-base text-[#6b7280] dark:text-slate-400 text-center">Your feedback has been submitted successfully.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f9fafb] dark:bg-black" contentContainerStyle={{ padding: 16, paddingBottom: scrollBottomPad }}>
      <View className="p-cy-lg pt-10">
        <Text className="text-[28px] font-bold text-[#1e293b] dark:text-slate-100 text-center">Rate Your Experience</Text>

        {/* Profile Avatar */}
        <View className="mt-[32px] items-center">
          <View
            testID="route-feedback-avatar-shell"
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 2.5,
              borderColor: isDark ? '#334155' : '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <View
              testID="route-feedback-avatar-fallback"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: profile?.avatarColor ?? '#3b82f6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text testID="route-feedback-avatar-initials" style={{ color: '#fff', fontSize: 26, fontWeight: '700' }}>
                {avatarInitials}
              </Text>
            </View>
            {avatarSource ? (
              <Image
                source={avatarSource}
                fadeDuration={0}
                testID="route-feedback-avatar-image"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                }}
              />
            ) : null}
          </View>
          {firstName ? (
            <Text className="mt-3 text-base text-[#64748b] dark:text-slate-400">
              How was your ride, {firstName}?
            </Text>
          ) : null}
        </View>

        {/* Star Rating */}
        <View className="mt-[24px] items-center">
          <Text className="text-lg font-semibold text-[#374151] dark:text-slate-100 mb-cy-lg">Your Rating</Text>
          <View className="flex-row justify-center gap-cy-sm">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                onPressIn={() => setHoveredRating(star)}
                onPressOut={() => setHoveredRating(0)}
                className="p-1"
              >
                <MaterialCommunityIcons
                  name="star"
                  size={48}
                  color={star <= (hoveredRating || rating) ? '#fbbf24' : '#d1d5db'}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text className="mt-2 text-sm text-[#6b7280] dark:text-slate-400">
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Very Good!'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Needs Improvement'}
            </Text>
          )}
        </View>

        {/* Written Feedback */}
        <View className="mt-[32px]">
          <Text className="text-lg font-semibold text-[#374151] dark:text-slate-100 mb-cy-lg">Additional Comments (Optional)</Text>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Tell us about your experience on this route..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            multiline
            numberOfLines={5}
            className="border border-[#d1d5db] rounded-cy-md p-cy-md text-base bg-white dark:bg-[#111111] dark:text-slate-100"
            style={{ minHeight: 120 }}
            textAlignVertical="top"
          />
        </View>

        {/* Route Summary */}
        <View className="bg-[#f3f4f6] dark:bg-black rounded-cy-md p-cy-lg mt-[32px]">
          <Text className="text-lg font-semibold text-[#374151] dark:text-slate-100 mb-cy-lg">Route Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151] dark:text-slate-100">Route:</Text>
            <Text className="text-[#6b7280] dark:text-slate-400">{routeData.name}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151] dark:text-slate-100">Distance:</Text>
            <Text className="text-[#6b7280] dark:text-slate-400">
              {(rideSummary?.distanceKm ?? routeData.distance).toFixed(rideSummary ? 2 : 0)} km
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151] dark:text-slate-100">Time:</Text>
            <Text className="text-[#6b7280] dark:text-slate-400">
              {rideSummary?.elapsedMinutes ?? routeData.estimatedTime} minutes
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151] dark:text-slate-100">Checkpoints Visited:</Text>
            <Text className="text-[#6b7280] dark:text-slate-400">
              {rideSummary?.checkpointsVisited ?? routeData.checkpoints.length}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          className={`rounded-cy-md p-cy-lg items-center mt-[32px] flex-row justify-center gap-2 ${rating === 0 || isSubmitting ? 'bg-[#d1d5db]' : 'bg-[#3b82f6]'}`}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          testID="route-feedback-submit"
        >
          {isSubmitting ? <ActivityIndicator color="#ffffff" /> : null}
          <Text className="text-white text-base font-semibold">
            {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
          </Text>
        </Pressable>

        {rating === 0 && !isSubmitting && (
          <Text className="text-center text-sm text-[#9ca3af] dark:text-slate-400 mt-2">Please select a rating to continue</Text>
        )}
      </View>
    </ScrollView>
  );
}
