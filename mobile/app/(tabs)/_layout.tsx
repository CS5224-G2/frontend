import { useContext } from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect } from 'expo-router';
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';

import { AuthContext } from '@/app/AuthContext';

const selectedTintColor =
  Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#2563eb',
        dark: '#60a5fa',
      })
    : '#2563eb';

const labelColor =
  Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#111827',
        dark: '#e5e7eb',
      })
    : '#111827';

const tabBarBackgroundColor = Platform.OS === 'android' ? '#ffffff' : null;

export default function TabsLayout() {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <NativeTabs
      tintColor={selectedTintColor}
      backgroundColor={tabBarBackgroundColor}
      labelStyle={{
        color: labelColor,
        fontSize: 11,
        fontWeight: '700',
      }}
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="history-tab">
        <Icon
          sf={{ default: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="history" />}
        />
        <Label>History</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="home-tab">
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="home" />}
        />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile-tab">
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="account-outline" />}
        />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
