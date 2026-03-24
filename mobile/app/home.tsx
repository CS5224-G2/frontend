import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Home: discover recommended routes or customise route (start/end, preferences).
 */
export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title} testID="home-title">
        Home
      </Text>
      <Text style={styles.subtitle}>Discover routes or customise your next ride</Text>

      <Pressable
        style={styles.primary}
        onPress={() => router.push('/route-config')}
        testID="home-configure-route"
      >
        <Text style={styles.primaryText}>Configure custom route</Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={() => router.push('/route')}
        testID="home-browse-routes"
      >
        <Text style={styles.secondaryText}>Browse recommended routes</Text>
      </Pressable>

      <Pressable style={styles.link} onPress={() => router.push('/profile')} testID="home-profile">
        <Text style={styles.linkText}>Profile settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 300,
  },
  primary: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 12,
    minWidth: 280,
    alignItems: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondary: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
    minWidth: 280,
    alignItems: 'center',
  },
  secondaryText: { color: '#3730a3', fontSize: 15, fontWeight: '700' },
  link: { padding: 8 },
  linkText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
