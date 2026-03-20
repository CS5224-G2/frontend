import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Route: show recommended route; open in Google/Apple Maps via deep link.
 * Implement: call backend for route + waypoints, build maps URL, Linking.openURL().
 * See src/services/maps.ts for URL builder placeholder.
 */
export default function RouteScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
        Route — export to Google/Apple Maps (placeholder)
      </Text>
      <Pressable
        onPress={() => router.push('/feedback')}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8 }}
      >
        <Text>Simulate: Ride done → Feedback</Text>
      </Pressable>
    </View>
  );
}
