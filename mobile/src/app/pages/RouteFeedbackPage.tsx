import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
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
    // In production, this would send the feedback to the backend
    console.log('Feedback submitted:', { routeId, rating, feedback });
    setSubmitted(true);

    // Redirect to home after showing success message
    setTimeout(() => {
      navigation.navigate('HomePage');
    }, 2000);
  };

  if (!routeData) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Route not found</Text>
          <Pressable style={styles.button} onPress={() => navigation.navigate('HomePage')}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (submitted) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.checkIcon}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successText}>Your feedback has been submitted successfully.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Rate Your Experience</Text>
        <Text style={styles.subtitle}>How was your ride on {routeData.name}?</Text>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                onPressIn={() => setHoveredRating(star)}
                onPressOut={() => setHoveredRating(0)}
                style={styles.starButton}
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
            <Text style={styles.ratingText}>
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Very Good!'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Needs Improvement'}
            </Text>
          )}
        </View>

        {/* Written Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Tell us about your experience on this route..."
            multiline
            numberOfLines={5}
            style={styles.textInput}
            textAlignVertical="top"
          />
        </View>

        {/* Route Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Route Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Route:</Text>
            <Text style={styles.summaryValue}>{routeData.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Distance:</Text>
            <Text style={styles.summaryValue}>{routeData.distance} km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{routeData.estimatedTime} minutes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Checkpoints Visited:</Text>
            <Text style={styles.summaryValue}>{routeData.checkpoints.length}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, rating === 0 && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        </Pressable>

        {rating === 0 && (
          <Text style={styles.hintText}>Please select a rating to continue</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  ratingSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  feedbackSection: {
    marginTop: 32,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  summaryCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginTop: 32,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: '500',
    color: '#374151',
  },
  summaryValue: {
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  checkIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
