import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  getUserProfile,
  deleteUserProfileAvatar,
  parseUserProfileParam,
  updateUserProfile,
  uploadUserProfileAvatar,
  UserProfile,
} from '@/services/userService';
import { getProfileAvatarSource } from '@/app/utils/profileAvatar';

const preferenceOptions: Array<UserProfile['cyclingPreference']> = [
  'Leisure',
  'Commuter',
  'Performance',
];

export default function EditProfilePage() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colorScheme } = useColorScheme();
  const params = route.params || {};
  const profileFromParams = useMemo(() => parseUserProfileParam(params.profile), [params.profile]);

  const [formState, setFormState] = useState<UserProfile | null>(profileFromParams);
  const [isLoading, setIsLoading] = useState(!profileFromParams);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profileFromParams) {
      setFormState(profileFromParams);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadFallbackProfile = async () => {
      try {
        const fetchedProfile = await getUserProfile();
        if (isMounted) {
          setFormState(fetchedProfile);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            'Unable to load profile',
            error instanceof Error ? error.message : 'Please try again later.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFallbackProfile();

    return () => {
      isMounted = false;
    };
  }, [profileFromParams]);

  const initials = useMemo(() => {
    if (!formState) {
      return '';
    }

    return formState.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [formState]);

  const avatarSource = useMemo(
    () => getProfileAvatarSource(formState?.avatarUrl),
    [formState?.avatarUrl]
  );

  const updateField = <Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) => {
    setFormState((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleUploadAvatar = async () => {
    if (!formState || isUploadingPhoto || isSaving) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access required',
        'Allow photo library access to choose a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const avatarUrl = await uploadUserProfileAvatar(result.assets[0].uri);
      updateField('avatarUrl', avatarUrl);
    } catch (uploadError) {
      Alert.alert(
        'Upload failed',
        uploadError instanceof Error
          ? uploadError.message
          : 'Profile picture could not be uploaded.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!formState || isUploadingPhoto || isSaving) {
      return;
    }

    setIsUploadingPhoto(true);

    try {
      await deleteUserProfileAvatar();
      updateField('avatarUrl', null);
    } catch (removeError) {
      Alert.alert(
        'Remove failed',
        removeError instanceof Error
          ? removeError.message
          : 'Profile picture could not be removed.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAvatarPress = () => {
    if (!formState || isUploadingPhoto || isSaving) {
      return;
    }

    Alert.alert('Profile photo', 'Choose what you want to do with your profile picture.', [
      {
        text: 'Upload photo',
        onPress: () => {
          void handleUploadAvatar();
        },
      },
      {
        text: 'Remove avatar',
        style: 'destructive',
        onPress: () => {
          void handleRemoveAvatar();
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleSave = async () => {
    if (!formState) {
      return;
    }

    if (!formState.fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name before saving.');
      return;
    }

    if (!formState.location.trim()) {
      Alert.alert('Missing location', 'Please enter your city or preferred riding area.');
      return;
    }

    setIsSaving(true);

    try {
      await updateUserProfile({
        ...formState,
        fullName: formState.fullName.trim(),
        location: formState.location.trim(),
        bio: formState.bio.trim(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Your changes could not be saved.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formState) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F3F4F6] dark:bg-black">
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#3b82f6' : '#1D4ED8'} />
        <Text className="mt-4 text-[20px] font-bold text-slate-900 dark:text-slate-100">Preparing edit form</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-[#F3F4F6] dark:bg-black" 
      contentContainerStyle={{ 
        padding: 20, 
        gap: 16,
        paddingBottom: Platform.OS === 'android' ? 100 : 20,
      }}
    >
      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-cy-xl items-center border border-border dark:border-[#2d2d2d]">
        <Pressable
          testID="edit-profile-avatar-button"
          className="mb-4"
          onPress={handleAvatarPress}
          disabled={isUploadingPhoto || isSaving}
        >
          <View>
            {avatarSource ? (
              <Image
                source={avatarSource}
                className="rounded-full"
                style={{ width: 82, height: 82 }}
              />
            ) : (
              <View
                className="justify-center items-center rounded-full"
                style={{ width: 82, height: 82, backgroundColor: formState.avatarColor }}
              >
                <Text className="text-white text-[28px] font-extrabold">{initials}</Text>
              </View>
            )}
            <View
              className="absolute right-0 bottom-0 justify-center items-center rounded-full bg-primary-dark dark:bg-blue-600 border-2 border-white dark:border-[#111111]"
              style={{ width: 28, height: 28 }}
            >
              <MaterialCommunityIcons
                name={isUploadingPhoto ? 'image-sync' : 'camera-outline'}
                size={15}
                color="#ffffff"
              />
            </View>
          </View>
        </Pressable>
        <Text className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100">Edit profile</Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-text-secondary dark:text-slate-400 text-center">
          Update your public details, riding preference, weekly goal, and tap your profile photo to change it.
        </Text>
        <Text className="mt-2 text-[13px] font-semibold text-[#1D4ED8] dark:text-blue-400">
          {isUploadingPhoto ? 'Updating photo...' : 'Tap the camera icon to manage photo'}
        </Text>
      </View>

      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-5 border border-border dark:border-[#2d2d2d]">
        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900 dark:text-slate-100">Full name</Text>
        <TextInput
          value={formState.fullName}
          onChangeText={(value) => updateField('fullName', value)}
          placeholder="Enter your full name"
          placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
          className="border border-border dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 text-[15px]"
          style={{ minHeight: 54 }}
        />

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900 dark:text-slate-100">Email</Text>
        <TextInput
          value={formState.email}
          editable={false}
          selectTextOnFocus={false}
          className="border border-border dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] dark:bg-[#1a1a1a] text-text-secondary dark:text-slate-400 text-[15px]"
          style={{ minHeight: 54 }}
        />
        <Text className="mt-2 text-[13px] leading-[18px] text-text-secondary dark:text-slate-400">Email is locked until backend account flows are ready.</Text>

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900 dark:text-slate-100">Location</Text>
        <TextInput
          value={formState.location}
          onChangeText={(value) => updateField('location', value)}
          placeholder="City, State"
          placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
          className="border border-border dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 text-[15px]"
          style={{ minHeight: 54 }}
        />

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900 dark:text-slate-100">Bio</Text>
        <TextInput
          value={formState.bio}
          onChangeText={(value) => updateField('bio', value)}
          placeholder="Tell other riders about your style."
          placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
          multiline
          textAlignVertical="top"
          className="border border-border dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 text-[15px]"
          style={{ minHeight: 54 + 66 }}
        />
      </View>

      <View className="bg-white dark:bg-[#111111] rounded-[24px] p-5 border border-border dark:border-[#2d2d2d]">
        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900 dark:text-slate-100">Cycling preference</Text>
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {preferenceOptions.map((option) => {
            const isSelected = formState.cyclingPreference === option;

            return (
              <Pressable
                key={option}
                className={`px-cy-lg py-cy-md rounded-full border ${isSelected ? 'bg-[#DBEAFE] dark:bg-[#1e293b] border-[#1D4ED8]' : 'bg-[#F8FAFC] dark:bg-[#1a1a1a] border-border dark:border-[#2d2d2d]'}`}
                onPress={() => updateField('cyclingPreference', option)}
              >
                <Text className={`text-[14px] font-semibold ${isSelected ? 'text-[#1D4ED8] dark:text-blue-400' : 'text-text-secondary dark:text-slate-400'}`}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900 dark:text-slate-100">Weekly goal (km)</Text>
        <TextInput
          value={String(formState.weeklyGoalKm)}
          keyboardType="number-pad"
          onChangeText={(value) => {
            const numericValue = Number(value.replace(/[^0-9]/g, ''));
            updateField('weeklyGoalKm', Number.isNaN(numericValue) ? 0 : numericValue);
          }}
          placeholder="80"
          placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
          className="border border-border dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 text-[15px]"
          style={{ minHeight: 54 }}
        />
      </View>

      <View className="flex-row mb-2" style={{ gap: 12 }}>
        <Pressable
          className="flex-1 justify-center items-center bg-white dark:bg-[#111111] border border-border dark:border-[#2d2d2d] rounded-cy-xl"
          style={{ minHeight: 54 }}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-bold">Cancel</Text>
        </Pressable>
        <Pressable
          className="flex-1 justify-center items-center bg-primary-dark rounded-cy-xl"
          style={{ minHeight: 54 }}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text className="text-white text-[15px] font-bold">{isSaving ? 'Saving...' : 'Save changes'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
