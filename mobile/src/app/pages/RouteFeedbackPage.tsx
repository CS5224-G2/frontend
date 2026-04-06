import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { type Route } from '../../../../shared/types/index';
import { getRouteById } from '../../services/routeService';
import { submitRideFeedback } from '../../services/rideService';
import { useFloatingTabBarScrollPadding } from '../utils/floatingTabBarInset';

type Props = NativeStackScreenProps<any, any>;

export default function RouteFeedbackPage({ navigation, route }: Props) {
  const { routeId } = route.params || { routeId: '1' };
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [routeData, setRouteData] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollBottomPad = useFloatingTabBarScrollPadding(20);

  useEffect(() => {
    getRouteById(routeId).then((r) => {
      setRouteData(r);
      setIsLoading(false);
    });
  }, [routeId]);

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
        <Text className="text-sm text-[#64748b] dark:text-slate-400 mt-2 text-center">How was your ride on {routeData.name}?</Text>

        {/* Star Rating */}
        <View className="mt-[32px] items-center">
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
            <Text className="text-[#6b7280] dark:text-slate-400">{routeData.distance} km</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151] dark:text-slate-100">Time:</Text>
            <Text className="text-[#6b7280] dark:text-slate-400">{routeData.estimatedTime} minutes</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151] dark:text-slate-100">Checkpoints Visited:</Text>
            <Text className="text-[#6b7280] dark:text-slate-400">{routeData.checkpoints.length}</Text>
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
