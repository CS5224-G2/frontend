import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
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
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="RideHistory" component={RouteHistoryScreen} options={{ title: 'Ride History' }} />
      <Stack.Screen name="HistoryDetails" component={RouteHistoryDetailsScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="HistoryRouteFeedback" component={RouteFeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
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

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
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
        tabBarActiveTintColor: isDark ? '#3b82f6' : '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: isDark ? { backgroundColor: '#111111' } : undefined,
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
