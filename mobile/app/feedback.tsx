import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Post-ride feedback: checkpoint summary, rate route (comfort, scenery, crowding), submit.
 * Implement: display checkpoint details, rating form, API call to submit rating.
 */
export default function FeedbackScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
        Feedback — rate your ride (placeholder)
      </Text>
      <Pressable
        onPress={() => router.replace('/home')}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 8 }}
      >
        <Text>Submit and back to Home</Text>
      </Pressable>
    </View>
  );
}
