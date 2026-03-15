import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Entry screen. Replace with real logic: check onboarding completion, then go to home or onboarding.
 */
export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
        CycleLink — Frontend placeholder
      </Text>
      <Pressable
        onPress={() => router.replace('/onboarding')}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8, marginVertical: 4 }}
      >
        <Text>Go to Onboarding</Text>
      </Pressable>
      <Pressable
        onPress={() => router.replace('/home')}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8, marginVertical: 4 }}
      >
        <Text>Go to Home</Text>
      </Pressable>
    </View>
  );
}
