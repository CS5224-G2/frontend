import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import { Platform, StatusBar } from 'react-native';

import HomeScreen from './pages/HomePage';
import UserProfileScreen from './pages/UserProfilePage';
import EditProfileScreen from './pages/EditProfilePage';
import ChangePasswordScreen from './pages/ChangePasswordPage';
import PrivacySecurityScreen from './pages/PrivacySecurityPage';
import RouteRecommendationScreen from './pages/RouteRecommendationPage';
import RouteDetailsScreen from './pages/RouteDetailsPage';
import RouteConfirmedScreen from './pages/RouteConfirmedPage';
import RouteFeedbackScreen from './pages/RouteFeedbackPage';
import RouteHistoryScreen from './pages/RideHistoryPage';
import RouteHistoryDetailsScreen from './pages/RouteHistoryDetailsPage';
import RouteConfigScreen from './pages/RouteConfigPage';

const Stack = createNativeStackNavigator<any>();

function getStackScreenOptions(isDark: boolean) {
  return {
    headerStyle: {
      backgroundColor: isDark ? '#000000' : '#ffffff',
    },
    headerTintColor: isDark ? '#f8fafc' : '#111827',
    headerTitleStyle: {
      color: isDark ? '#f8fafc' : '#111827',
      fontWeight: '700' as const,
    },
    headerShadowVisible: !isDark,
    contentStyle: {
      backgroundColor: isDark ? '#000000' : '#f8fafc',
    },
  };
}

export function HomeNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack.Navigator screenOptions={getStackScreenOptions(isDark)}>
      <Stack.Screen name="HomePage" component={HomeScreen} options={{ headerShown: false, contentStyle: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0 } }} />
      <Stack.Screen name="RouteConfig" component={RouteConfigScreen} options={{ title: 'Customize Route' }} />
      <Stack.Screen name="Recommendation" component={RouteRecommendationScreen} options={{ title: 'Route Recommendation' }} />
      <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} options={{ title: 'Route Details' }} />
      <Stack.Screen name="RouteConfirmed" component={RouteConfirmedScreen} options={{ title: 'Route Confirmed' }} />
      <Stack.Screen name="RouteFeedback" component={RouteFeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}

export function HistoryNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack.Navigator screenOptions={getStackScreenOptions(isDark)}>
      <Stack.Screen name="RideHistory" component={RouteHistoryScreen} options={{ headerShown: false, contentStyle: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0 } }} />
      <Stack.Screen name="HistoryDetails" component={RouteHistoryDetailsScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="HistoryRouteFeedback" component={RouteFeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}

export function ProfileNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack.Navigator screenOptions={getStackScreenOptions(isDark)}>
      <Stack.Screen name="ProfileMain" component={UserProfileScreen} options={{ headerShown: false, contentStyle: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0 } }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ title: 'Privacy & Security' }} />
    </Stack.Navigator>
  );
}
