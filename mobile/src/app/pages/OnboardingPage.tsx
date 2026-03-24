import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bike, Trees, Mountain, Route, Wind, Info } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { AuthContext } from '../AuthContext';

type Props = NativeStackScreenProps<any, any>;

interface UserPreferences {
  cyclistType: 'recreational' | 'commuter' | 'fitness' | 'general';
  preferredShade: number;
  elevation: number;
  distance: number;
  airQuality: number;
}

export default function OnboardingPage({ navigation }: Props) {
  const { login } = useContext(AuthContext);
  const [preferences, setPreferences] = useState<UserPreferences>({
    cyclistType: 'general',
    preferredShade: 50,
    elevation: 50,
    distance: 10,
    airQuality: 50,
  });

  const cyclistTypes = [
    { type: 'recreational' as const, label: 'Recreational', icon: Trees, description: 'Leisurely rides for enjoyment' },
    { type: 'commuter' as const, label: 'Commuter', icon: Route, description: 'Fast routes for daily travel' },
    { type: 'fitness' as const, label: 'Fitness', icon: Mountain, description: 'Challenging routes for training' },
    { type: 'general' as const, label: 'General', icon: Bike, description: 'Balanced all-purpose cycling' },
  ];

  const handleConfirm = () => {
    // In a real app, you'd save to AsyncStorage or a state management solution
    console.log('User preferences:', preferences);
    login(); // This triggers navigation to AppNavigator
  };

  const CyclistTypeButton = ({ type, label, icon: Icon, description, isSelected }: any) => (
    <TouchableOpacity
      style={[styles.cyclistTypeButton, isSelected && styles.cyclistTypeButtonSelected]}
      onPress={() => setPreferences({ ...preferences, cyclistType: type })}
    >
      <Icon size={24} color={isSelected ? '#3b82f6' : '#6b7280'} />
      <Text style={[styles.cyclistTypeLabel, isSelected && styles.cyclistTypeLabelSelected]}>{label}</Text>
      <Text style={styles.cyclistTypeDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Info Button */}
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => navigation.navigate('UserJourneyPage')}
        >
          <Info size={16} color="#6b7280" />
          <Text style={styles.infoButtonText}>View Journey</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Welcome to CycleLink</Text>
            <Text style={styles.subtitle}>Let's personalize your cycling experience</Text>
          </View>

          <View style={styles.cardContent}>
            {/* Cyclist Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What type of cyclist are you?</Text>
              <View style={styles.cyclistTypeGrid}>
                {cyclistTypes.map(({ type, label, icon, description }) => (
                  <CyclistTypeButton
                    key={type}
                    type={type}
                    label={label}
                    icon={icon}
                    description={description}
                    isSelected={preferences.cyclistType === type}
                  />
                ))}
              </View>
            </View>

            {/* Preferred Shade */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Trees size={20} color="#6b7280" />
                <Text style={styles.sliderLabel}>Preferred Shade: {preferences.preferredShade}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={preferences.preferredShade}
                onValueChange={(value) => setPreferences({ ...preferences, preferredShade: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Full Sun</Text>
                <Text style={styles.sliderLabelText}>Full Shade</Text>
              </View>
            </View>

            {/* Elevation Preference */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Mountain size={20} color="#6b7280" />
                <Text style={styles.sliderLabel}>Elevation Challenge: {preferences.elevation}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={preferences.elevation}
                onValueChange={(value) => setPreferences({ ...preferences, elevation: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Flat</Text>
                <Text style={styles.sliderLabelText}>Hilly</Text>
              </View>
            </View>

            {/* Distance */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Route size={20} color="#6b7280" />
                <Text style={styles.sliderLabel}>Preferred Distance: {preferences.distance} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={50}
                step={5}
                value={preferences.distance}
                onValueChange={(value) => setPreferences({ ...preferences, distance: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>5 km</Text>
                <Text style={styles.sliderLabelText}>50 km</Text>
              </View>
            </View>

            {/* Air Quality */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Wind size={20} color="#6b7280" />
                <Text style={styles.sliderLabel}>Minimum Air Quality: {preferences.airQuality}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={preferences.airQuality}
                onValueChange={(value) => setPreferences({ ...preferences, airQuality: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Any</Text>
                <Text style={styles.sliderLabelText}>Pristine</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dbeafe',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  infoButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  cardContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  cyclistTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cyclistTypeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cyclistTypeButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  cyclistTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  cyclistTypeLabelSelected: {
    color: '#3b82f6',
  },
  cyclistTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#3b82f6',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
