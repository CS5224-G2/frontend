import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const TAB_ICONS: Record<string, { active: React.ComponentProps<typeof MaterialCommunityIcons>['name']; inactive: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = {
  HistoryTab: { active: 'history', inactive: 'history' },
  HomeTab: { active: 'home', inactive: 'home-outline' },
  ProfileTab: { active: 'account', inactive: 'account-outline' },
};

const liquidGlassPalette = {
  light: {
    shell: ['rgba(255,255,255,0.94)', 'rgba(243,246,251,0.86)'] as const,
    sheen: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.08)'] as const,
    border: 'rgba(255,255,255,0.82)',
    label: '#2f3746',
    activeLabel: '#1d74f5',
    activeShell: ['rgba(255,255,255,0.82)', 'rgba(229,236,245,0.96)'] as const,
    activeBorder: 'rgba(255,255,255,0.9)',
    activeGlow: 'rgba(108, 209, 255, 0.24)',
    shadow: 'rgba(148, 163, 184, 0.26)',
  },
  dark: {
    shell: ['rgba(20,24,34,0.95)', 'rgba(34,41,57,0.9)'] as const,
    sheen: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)'] as const,
    border: 'rgba(255,255,255,0.12)',
    label: '#cbd5e1',
    activeLabel: '#7dd3fc',
    activeShell: ['rgba(51,65,85,0.84)', 'rgba(30,41,59,0.98)'] as const,
    activeBorder: 'rgba(148,163,184,0.32)',
    activeGlow: 'rgba(59, 130, 246, 0.24)',
    shadow: 'rgba(2, 6, 23, 0.52)',
  },
};

function LiquidGlassTabBar({ state, descriptors, navigation, isDark }: BottomTabBarProps & { isDark: boolean }) {
  const insets = useSafeAreaInsets();
  const palette = isDark ? liquidGlassPalette.dark : liquidGlassPalette.light;

  return (
    <View pointerEvents="box-none" style={[styles.tabBarHost, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.tabBarShadow,
          {
            shadowColor: palette.shadow,
          },
        ]}
      >
        <LinearGradient
          colors={palette.shell}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={[
            styles.tabBarShell,
            {
              borderColor: palette.border,
            },
          ]}
        >
          <LinearGradient
            colors={palette.sheen}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.absoluteFill}
          />
          <View style={[styles.topHighlight, { backgroundColor: palette.border }]} />
          <View style={styles.tabRow}>
            {state.routes.map((route, index) => {
              const descriptor = descriptors[route.key];
              const options = descriptor.options;
              const isFocused = state.index === index;
              const color = isFocused ? palette.activeLabel : palette.label;
              const iconSize = 28;

              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : typeof options.title === 'string'
                    ? options.title
                    : route.name.replace(/Tab$/, '');

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const icon = options.tabBarIcon?.({
                focused: isFocused,
                color,
                size: iconSize,
              }) ?? (
                <MaterialCommunityIcons
                  color={color}
                  name={TAB_ICONS[route.name]?.[isFocused ? 'active' : 'inactive'] ?? 'circle-outline'}
                  size={iconSize}
                />
              );

              return (
                <Pressable
                  key={route.key}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onLongPress={onLongPress}
                  onPress={onPress}
                  style={[styles.tabItem, isFocused && styles.tabItemActive]}
                  testID={options.tabBarButtonTestID}
                >
                  {isFocused ? (
                    <>
                      <View style={[styles.activeGlow, { backgroundColor: palette.activeGlow }]} />
                      <LinearGradient
                        colors={palette.activeShell}
                        end={{ x: 0.88, y: 1 }}
                        start={{ x: 0.12, y: 0 }}
                        style={[
                          styles.activeCapsule,
                          {
                            borderColor: palette.activeBorder,
                          },
                        ]}
                      />
                    </>
                  ) : null}
                  <View style={styles.tabContent}>
                    {icon}
                    <Text style={[styles.tabLabel, { color }]}>{label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
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
      tabBar={(props) => <LiquidGlassTabBar {...props} isDark={isDark} />}
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
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
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
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  activeCapsule: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
  },
  activeGlow: {
    position: 'absolute',
    top: 6,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.9,
  },
  tabBarHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  tabBarShadow: {
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 18,
  },
  tabBarShell: {
    borderWidth: 1,
    borderRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabItem: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
  },
  tabItemActive: {
    transform: [{ translateY: -1 }],
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 1,
    opacity: 0.65,
  },
});
