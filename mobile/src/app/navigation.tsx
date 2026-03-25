import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { AuthContext, AuthProvider } from './AuthContext';
import { useColorScheme } from 'nativewind';

// Import pages
import HomeScreen from './pages/HomePage';
import LoginScreen from './pages/LoginPage';
import RegisterScreen from './pages/RegisterPage';
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
import LiveMapScreen from './pages/LiveMapPage';
import OnboardingScreen from './pages/OnboardingPage';
import UserJourneyScreen from './pages/UserJourneyPage';

const Stack = createNativeStackNavigator<any>();
const Tab = createBottomTabNavigator<any>();
const AuthStack = createNativeStackNavigator<any>();

const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

function TabBarBackground({ isDark }: { isDark: boolean }) {
  if (!supportsNativeGlass) {
    return (
      <View
        pointerEvents="none"
        style={[
          styles.tabBarBackgroundBase,
          isDark ? styles.tabBarFallbackDark : styles.tabBarFallbackLight,
        ]}
      />
    );
  }

  return (
    <GlassView
      pointerEvents="none"
      style={styles.tabBarBackgroundBase}
      glassEffectStyle="regular"
      colorScheme={isDark ? 'dark' : 'light'}
      tintColor={isDark ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.18)'}
    />
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomePage" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="RouteConfig" component={RouteConfigScreen} options={{ title: 'Customize Route' }} />
      <Stack.Screen name="Recommendation" component={RouteRecommendationScreen} options={{ title: 'Route Recommendation' }} />
      <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} options={{ title: 'Route Details' }} />
      <Stack.Screen name="RouteConfirmed" component={RouteConfirmedScreen} options={{ title: 'Route Confirmed' }} />
      <Stack.Screen name="RouteFeedback" component={RouteFeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}


function HistoryNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RideHistory" component={RouteHistoryScreen} options={{ title: 'Ride History' }} />
      <Stack.Screen name="HistoryDetails" component={RouteHistoryDetailsScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="HistoryRouteFeedback" component={RouteFeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ title: 'Privacy & Security' }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tabBarActiveTintColor = isDark ? '#f8fafc' : '#0f172a';
  const tabBarInactiveTintColor = isDark ? '#94a3b8' : '#475569';

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'help-circle-outline';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarActiveBackgroundColor: isDark
          ? 'rgba(59, 130, 246, 0.18)'
          : 'rgba(255, 255, 255, 0.52)',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [
          styles.tabBar,
          isDark ? styles.tabBarShadowDark : styles.tabBarShadowLight,
        ],
        tabBarBackground: () => <TabBarBackground isDark={isDark} />,
      })}
    >
      <Tab.Screen name="HistoryTab" component={HistoryNavigator} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}


export function RootNavigator() {
  const { isLoggedIn } = useContext(AuthContext);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#000000',
          card: '#111111',
          text: '#f1f5f9',
          border: '#2d2d2d',
          primary: '#3b82f6',
          notification: '#3b82f6',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#2563eb',
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      {!isLoggedIn ? <AuthNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}

export function RootNavigatorWithProvider() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    height: 76,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 0,
    borderRadius: 28,
    backgroundColor: 'transparent',
    elevation: 0,
    overflow: 'hidden',
  },
  tabBarShadowDark: {
    shadowColor: '#020617',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  tabBarShadowLight: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  tabBarBackgroundBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  tabBarFallbackDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  tabBarFallbackLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.94)',
  },
  tabBarItem: {
    marginHorizontal: 6,
    marginVertical: 4,
    borderRadius: 20,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
});
