import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mockRoutes } from '../types';

type Props = NativeStackScreenProps<any, any>;

export default function RouteFeedbackPage({ navigation, route }: Props) {
  const { routeId } = route.params || { routeId: '1' };
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const routeData = mockRoutes.find((r) => r.id === routeId);

  const handleSubmit = () => {
    console.log('Feedback submitted:', { routeId, rating, feedback });
    setSubmitted(true);

    setTimeout(() => {
      navigation.navigate('HomePage');
    }, 2000);
  };

  if (!routeData) {
    return (
      <ScrollView className="flex-1 bg-[#f9fafb]">
        <View className="p-cy-lg pt-10">
          <Text className="text-[28px] font-bold text-[#1e293b] text-center">Route not found</Text>
          <Pressable className="bg-[#3b82f6] rounded-cy-md p-cy-md items-center mt-cy-lg" onPress={() => navigation.navigate('HomePage')}>
            <Text className="text-white text-base">Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (submitted) {
    return (
      <ScrollView className="flex-1 bg-[#f9fafb]">
        <View className="flex-1 justify-center items-center p-[32px]">
          <View className="mb-[24px]">
            <MaterialCommunityIcons name="check-circle" size={48} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-[#1e293b] mb-2">Thank You!</Text>
          <Text className="text-base text-[#6b7280] text-center">Your feedback has been submitted successfully.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f9fafb]">
      <View className="p-cy-lg pt-10">
        <Text className="text-[28px] font-bold text-[#1e293b] text-center">Rate Your Experience</Text>
        <Text className="text-sm text-[#64748b] mt-2 text-center">How was your ride on {routeData.name}?</Text>

        {/* Star Rating */}
        <View className="mt-[32px] items-center">
          <Text className="text-lg font-semibold text-[#374151] mb-cy-lg">Your Rating</Text>
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
            <Text className="mt-2 text-sm text-[#6b7280]">
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
          <Text className="text-lg font-semibold text-[#374151] mb-cy-lg">Additional Comments (Optional)</Text>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Tell us about your experience on this route..."
            multiline
            numberOfLines={5}
            className="border border-[#d1d5db] rounded-cy-md p-cy-md text-base bg-white"
            style={{ minHeight: 120 }}
            textAlignVertical="top"
          />
        </View>

        {/* Route Summary */}
        <View className="bg-[#f3f4f6] rounded-cy-md p-cy-lg mt-[32px]">
          <Text className="text-lg font-semibold text-[#374151] mb-cy-lg">Route Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151]">Route:</Text>
            <Text className="text-[#6b7280]">{routeData.name}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151]">Distance:</Text>
            <Text className="text-[#6b7280]">{routeData.distance} km</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151]">Time:</Text>
            <Text className="text-[#6b7280]">{routeData.estimatedTime} minutes</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-medium text-[#374151]">Checkpoints Visited:</Text>
            <Text className="text-[#6b7280]">{routeData.checkpoints.length}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          className={`rounded-cy-md p-cy-lg items-center mt-[32px] ${rating === 0 ? 'bg-[#d1d5db]' : 'bg-[#3b82f6]'}`}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text className="text-white text-base font-semibold">Submit Feedback</Text>
        </Pressable>

        {rating === 0 && (
          <Text className="text-center text-sm text-[#9ca3af] mt-2">Please select a rating to continue</Text>
        )}
      </View>
    </ScrollView>
  );
}
