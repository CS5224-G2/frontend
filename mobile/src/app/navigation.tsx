import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext, AuthProvider } from './AuthContext';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

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

function RecommendationNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="Recommendation" component={RouteRecommendationScreen} options={{ title: 'Route Recommendation' }} />
      <Stack.Screen name="RouteConfig" component={RouteConfigScreen} options={{ title: 'Customize Route' }} />
      <Stack.Screen name="RecommendationDetails" component={RouteDetailsScreen} options={{ title: 'Route Details' }} />
      <Stack.Screen
        name="RouteConfirmed"
        component={RouteConfirmedScreen}
        options={{ title: 'Route Confirmed', headerShown: false }}
      />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RouteFeedback" component={RouteFeedbackScreen} options={{ title: 'Feedback' }} />
    </Stack.Navigator>
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
      <Stack.Screen
        name="RecommendationFlow"
        component={RecommendationNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} options={{ title: 'Route Details' }} />
      <Stack.Screen
        name="RouteConfirmed"
        component={RouteConfirmedScreen}
        options={{ title: 'Route Confirmed', headerShown: false }}
      />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} options={{ headerShown: false }} />
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
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'history' : 'history';
          }  else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }
          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
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

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
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
