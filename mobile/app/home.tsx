import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Home: discover recommended routes or customise route (start/end, preferences, checkpoints).
 * Implement: list of recommendations, custom route form, then navigate to route screen.
 */
export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
        Home — discover or customise routes (placeholder)
      </Text>
      <Pressable
        onPress={() => router.push('/route')}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8 }}
      >
        <Text>Open Route / Export to Maps</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/profile')}
        style={{ padding: 12, backgroundColor: '#dbeafe', borderRadius: 8, marginTop: 12 }}
      >
        <Text>Open Profile Settings</Text>
      </Pressable>
    </View>
  );
}
