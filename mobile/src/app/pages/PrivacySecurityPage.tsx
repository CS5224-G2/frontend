import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../AuthContext';
import { useTheme } from '../ThemeContext';

import {
  getPrivacySecuritySettings,
  PrivacySecuritySettings,
  updatePrivacySecuritySettings,
} from '@/services/settingsService';
import { deleteAccount } from '@/services/userService';

const defaultSettings: PrivacySecuritySettings = {
  noThirdPartyAds: false,
  noDataImprovement: false,
  notificationsManagedInDeviceSettings: true,
};

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View className="flex-row items-start" style={{ gap: 16 }}>
      <View className="flex-1" style={{ gap: 6 }}>
        <Text className="text-[15px] font-bold leading-[22px] text-slate-900 dark:text-slate-100">{title}</Text>
        <Text className="text-[14px] leading-[21px] text-text-secondary dark:text-slate-400">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: isDark ? '#1D4ED8' : '#93C5FD' }}
        thumbColor={value ? (isDark ? '#60A5FA' : '#1D4ED8') : '#F8FAFC'}
      />
    </View>
  );
}

export default function PrivacySecurityPage() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { logout } = useContext(AuthContext);
  const [settings, setSettings] = useState<PrivacySecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { preference, setPreference } = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pageSpacing = height < 700 ? 12 : height < 820 ? 14 : 16;
  const pagePaddingVertical = height < 700 ? 14 : 20;
  const pageBottomPadding = Math.max(insets.bottom + 20, Math.round(height * 0.04));

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
              await logout();
            } catch (error) {
              setIsDeleting(false);
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Your account could not be deleted. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const result = await getPrivacySecuritySettings();
        if (isMounted) {
          setSettings(result);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            'Unable to load settings',
            error instanceof Error ? error.message : 'Please try again later.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (
    key: 'noThirdPartyAds' | 'noDataImprovement',
    value: boolean
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Unable to open settings',
        'Your device settings could not be opened from CycleLink.'
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await updatePrivacySecuritySettings(settings);
      Alert.alert('Settings updated', 'Your privacy preferences were saved.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Your settings could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F3F4F6] dark:bg-black">
        <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#1D4ED8'} />
        <Text className="mt-4 text-[20px] font-bold text-slate-900 dark:text-slate-100">Loading security preferences</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F3F4F6] dark:bg-black"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: pagePaddingVertical,
        paddingBottom: pageBottomPadding,
        gap: pageSpacing,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-[22px] border border-border dark:border-[#2d2d2d]">
        <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-primary-dark mb-2">Privacy and device</Text>
        <Text className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100">Privacy & security</Text>
        <Text className="mt-[10px] text-[15px] leading-[22px] text-text-secondary dark:text-slate-400">
          Control how CycleLink uses your data and manage device-level permissions.
        </Text>
      </View>

      <View className="bg-[#DBEAFE] dark:bg-[#1e293b] rounded-[20px] p-[18px]">
        <Text className="text-[15px] font-extrabold text-slate-900 dark:text-slate-100 mb-1.5">Your privacy matters</Text>
        <Text className="text-[14px] leading-[21px] text-text-secondary dark:text-slate-400">
          These controls are stored locally in a mock service for now, but they mirror the backend
          contract the app will use later.
        </Text>
      </View>

      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-5 border border-border dark:border-[#2d2d2d]">
        <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100 mb-4">Privacy controls</Text>
        <ToggleRow
          title="Do not share my personal information for third-party targeted advertising"
          description="When enabled, CycleLink will opt you out of advertiser data sharing."
          value={settings.noThirdPartyAds}
          onValueChange={(value) => handleToggle('noThirdPartyAds', value)}
        />
        <View className="h-px bg-border dark:bg-[#2d2d2d] my-[18px]" />
        <ToggleRow
          title="Do not use personal data to improve application"
          description="Turn this on if you do not want account and ride data used for product improvements."
          value={settings.noDataImprovement}
          onValueChange={(value) => handleToggle('noDataImprovement', value)}
        />
      </View>

      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-5 border border-border dark:border-[#2d2d2d]">
        <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100 mb-4">Device permissions</Text>
        <Pressable
          testID="notifications-settings-button"
          className="flex-row justify-between items-center rounded-[18px] bg-[#F8FAFC] dark:bg-[#1a1a1a] border border-border dark:border-[#2d2d2d] p-cy-lg"
          style={{ gap: 12 }}
          onPress={handleOpenNotificationSettings}
        >
          <View className="flex-1" style={{ gap: 6 }}>
            <Text className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Notifications</Text>
            <Text className="text-[14px] leading-[21px] text-text-secondary dark:text-slate-400">
              Manage push permissions in your native phone settings.
            </Text>
          </View>
          <Text className="text-[14px] font-extrabold text-primary-dark">Open settings</Text>
        </Pressable>
      </View>

      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-5 border border-border dark:border-[#2d2d2d]">
        <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100 mb-4">Appearance</Text>
        <View className="flex-row" style={{ gap: 8 }}>
          {(['system', 'light', 'dark'] as const).map((pref) => (
            <Pressable
              key={pref}
              testID={`appearance-${pref}`}
              className={[
                'flex-1 items-center py-2 rounded-md',
                preference === pref
                  ? 'bg-primary dark:bg-blue-500'
                  : 'bg-bg-light dark:bg-[#1a1a1a]',
              ].join(' ')}
              onPress={() => setPreference(pref)}
            >
              <Text
                className={[
                  'text-[14px] font-semibold',
                  preference === pref
                    ? 'text-white'
                    : 'text-text-secondary dark:text-slate-400',
                ].join(' ')}
              >
                {pref.charAt(0).toUpperCase() + pref.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-5 border border-red-200 dark:border-red-900">
        <Text className="text-[12px] font-bold text-red-500 uppercase tracking-[0.8px] mb-3">Danger zone</Text>
        <Text className="text-[14px] leading-[21px] text-text-secondary dark:text-slate-400 mb-4">
          Permanently delete your CycleLink account and all associated data. This action cannot be undone.
        </Text>
        <Pressable
          testID="delete-account-button"
          className="justify-center items-center bg-red-500 rounded-[14px]"
          style={{ minHeight: 48 }}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-[15px] font-bold text-white">Delete account</Text>
          )}
        </Pressable>
      </View>

      <View className="flex-row mt-1" style={{ gap: 12 }}>
        <Pressable
          testID="privacy-security-cancel-button"
          className="flex-1 justify-center items-center border border-border dark:border-[#2d2d2d] bg-white dark:bg-[#111111] rounded-[18px]"
          style={{ minHeight: 54 }}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Cancel</Text>
        </Pressable>
        <Pressable
          testID="privacy-security-save-button"
          className="justify-center items-center bg-primary-dark rounded-[18px]"
          style={{ flex: 1.15, minHeight: 54 }}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-[15px] font-extrabold text-white">Save settings</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
