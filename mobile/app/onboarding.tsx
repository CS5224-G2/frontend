import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Onboarding: cyclist type + preferences (shade, elevation, cultural richness).
 * Implement: form, local persistence, then navigate to home.
 */
export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
        Onboarding — select cyclist type and preferences (placeholder)
      </Text>
      <Pressable
        onPress={() => router.replace('/home')}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8 }}
      >
        <Text>Continue to Home</Text>
      </Pressable>
    </View>
  );
}
