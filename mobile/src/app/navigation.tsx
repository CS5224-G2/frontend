import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
import { FLOATING_TAB_BAR_DOCK_HEIGHT } from './utils/floatingTabBarInset';

const Stack = createNativeStackNavigator<any>();
const Tab = createBottomTabNavigator<any>();
const AuthStack = createNativeStackNavigator<any>();
const TAB_BAR_DOCK_HEIGHT = FLOATING_TAB_BAR_DOCK_HEIGHT;

const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

function getTabIconName(routeName: string, focused: boolean) {
  if (routeName === 'HomeTab') {
    return focused ? 'home' : 'home-outline';
  }
  if (routeName === 'HistoryTab') {
    return focused ? 'history' : 'history';
  }
  if (routeName === 'ProfileTab') {
    return focused ? 'account' : 'account-outline';
  }
  return 'help-circle-outline';
}

function GlassSurface({
  isDark,
  style,
}: {
  isDark: boolean;
  style: any;
}) {
  if (!supportsNativeGlass) {
    return (
      <View
        pointerEvents="none"
        style={[
          style,
          isDark ? styles.tabBarFallbackDark : styles.tabBarFallbackLight,
        ]}
      />
    );
  }

  return (
    <GlassView
      pointerEvents="none"
      style={style}
      glassEffectStyle="clear"
      colorScheme={isDark ? 'dark' : 'light'}
      tintColor={isDark ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.18)'}
    />
  );
}

function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const activeColor = '#2f6df6';
  const inactiveColor = isDark ? '#cbd5e1' : '#1f2937';
  const bottomOffset = Math.max(insets.bottom, 10);
  const [dockWidth, setDockWidth] = useState(0);
  const indicatorTranslateX = useSharedValue(0);
  const indicatorScale = useSharedValue(0.92);
  const routeCount = state.routes.length;
  const rowHorizontalPadding = 10;
  const rowVerticalPadding = 6;
  const availableWidth = Math.max(dockWidth - rowHorizontalPadding * 2, 0);
  const tabWidth = routeCount > 0 ? availableWidth / routeCount : 0;
  const indicatorWidth = tabWidth > 0 ? Math.max(72, Math.min(96, tabWidth - 8)) : 0;
  const indicatorX =
    tabWidth > 0
      ? rowHorizontalPadding + state.index * tabWidth + (tabWidth - indicatorWidth) / 2
      : 0;

  useEffect(() => {
    if (dockWidth === 0) {
      return;
    }
    indicatorScale.value = 0.96;
    indicatorTranslateX.value = withTiming(indicatorX, { duration: 280 });
    indicatorScale.value = withTiming(1, { duration: 280 });
  }, [dockWidth, indicatorScale, indicatorTranslateX, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorTranslateX.value },
      { scale: indicatorScale.value },
    ],
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        onLayout={(event) => setDockWidth(event.nativeEvent.layout.width)}
        style={[styles.tabBarDock, styles.tabBarShadow, { bottom: bottomOffset }]}
      >
        <GlassSurface isDark={isDark} style={styles.tabBarBackgroundBase} />
        {indicatorWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              isDark ? styles.activeIndicatorDark : styles.activeIndicatorLight,
              {
                top: rowVerticalPadding,
                width: indicatorWidth,
                height: TAB_BAR_DOCK_HEIGHT - rowVerticalPadding * 2,
              },
              indicatorStyle,
            ]}
          />
        ) : null}
        <View style={styles.tabBarRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
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

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
              >
                <View style={styles.tabButtonInner}>
                  <View style={styles.iconSlot}>
                    <MaterialCommunityIcons
                      name={getTabIconName(route.name, focused)}
                      size={20}
                      color={focused ? activeColor : inactiveColor}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: focused ? activeColor : inactiveColor },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
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
    <Stack.Navigator>
      <Stack.Screen name="HomePage" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="RouteConfig" component={RouteConfigScreen} options={{ title: 'Customize Route' }} />
      <Stack.Screen name="Recommendation" component={RouteRecommendationScreen} options={{ title: 'Route Recommendation' }} />
      <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} options={{ title: 'Route Details' }} />
      <Stack.Screen name="RouteConfirmed" component={RouteConfirmedScreen} options={{ title: 'Route Confirmed' }} />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} options={{ headerShown: false }} />
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
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          return (
            <MaterialCommunityIcons
              name={getTabIconName(route.name, focused)}
              size={size}
              color={color}
            />
          );
        }
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
  tabBarDock: {
    position: 'absolute',
    left: 22,
    right: 22,
    height: TAB_BAR_DOCK_HEIGHT,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  tabBarBackgroundBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  tabBarRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    borderRadius: 22,
  },
  activeIndicatorLight: {
    backgroundColor: '#e5e7eb',
  },
  activeIndicatorDark: {
    backgroundColor: 'rgba(71, 85, 105, 0.9)',
  },
  iconSlot: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabBarShadow: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  tabBarFallbackDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
  },
  tabBarFallbackLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
});
