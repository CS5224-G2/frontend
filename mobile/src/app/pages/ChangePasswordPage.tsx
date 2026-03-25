import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { updatePassword } from '@/services/settingsService';

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry: boolean;
  onToggleVisibility: () => void;
  helperText?: string;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  onToggleVisibility,
  helperText,
}: PasswordFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-[14px] font-bold text-slate-900">{label}</Text>
      <View
        className="flex-row items-center border border-border rounded-[18px] bg-[#F8FAFC] px-cy-lg"
        style={{ minHeight: 56, gap: 12 }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-[16px] text-slate-900"
        />
        <Pressable onPress={onToggleVisibility} hitSlop={12}>
          <Text className="text-[14px] font-bold text-primary-dark">{secureTextEntry ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>
      {helperText ? <Text className="text-[13px] leading-[18px] text-text-secondary">{helperText}</Text> : null}
    </View>
  );
}

export default function ChangePasswordPage() {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!newPassword.length) {
      return { label: 'Enter a new password', color: '#64748B', fillPercent: 0 };
    }

    if (newPassword.length < 8) {
      return { label: 'Weak password', color: '#DC2626', fillPercent: 33 };
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { label: 'Fair password', color: '#D97706', fillPercent: 66 };
    }

    return { label: 'Strong password', color: '#15803D', fillPercent: 100 };
  }, [newPassword]);

  const passwordsMatch = !confirmNewPassword.length || newPassword === confirmNewPassword;
  const isSubmitDisabled =
    isSaving ||
    !currentPassword.trim() ||
    !newPassword.trim() ||
    !confirmNewPassword.trim() ||
    !passwordsMatch;

  const handleSave = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert('Missing information', 'Please complete all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Passwords do not match', 'Make sure the new passwords are identical.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters for the new password.');
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      Alert.alert(
        'Choose a different password',
        'Your new password must be different from the current password.'
      );
      return;
    }

    setIsSaving(true);

    try {
      await updatePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      Alert.alert('Password changed', 'Your CycleLink password was updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to change password',
        error instanceof Error ? error.message : 'Please try again again later.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#F3F4F6]" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="bg-white rounded-[24px] p-[22px] border border-border">
        <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-primary-dark mb-2">Security</Text>
        <Text className="text-[28px] font-extrabold text-slate-900">Change password</Text>
        <Text className="mt-[10px] text-[15px] leading-[22px] text-text-secondary">
          Update your account credentials and keep your CycleLink profile secure.
        </Text>
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border" style={{ gap: 16 }}>
        <PasswordField
          label="Current password"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrentPassword}
          onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
        />

        <PasswordField
          label="New password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          onToggleVisibility={() => setShowNewPassword((value) => !value)}
          helperText="Use at least 8 characters, including one number and one uppercase letter."
        />

        <View className="gap-2">
          <View className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${passwordStrength.fillPercent}%`,
                backgroundColor: passwordStrength.color,
              }}
            />
          </View>
          <Text className="text-[13px] font-bold" style={{ color: passwordStrength.color }}>
            {passwordStrength.label}
          </Text>
        </View>

        <PasswordField
          label="Confirm new password"
          placeholder="Re-enter new password"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry={!showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
        />

        {!passwordsMatch ? (
          <Text className="text-[13px] font-semibold text-[#DC2626]">Confirmation must match the new password.</Text>
        ) : null}
      </View>

      <View className="bg-[#DBEAFE] rounded-[20px] p-[18px]">
        <Text className="text-[15px] font-extrabold text-slate-900 mb-1.5">Security tip</Text>
        <Text className="text-[14px] leading-[21px] text-text-secondary">
          The mock backend password is currently set to `CycleLink123` for demo purposes.
        </Text>
      </View>

      <View className="flex-row mt-1 mb-6" style={{ gap: 12 }}>
        <Pressable
          testID="change-password-cancel-button"
          className="flex-1 justify-center items-center border border-border bg-white rounded-[18px]"
          style={{ minHeight: 54 }}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text className="text-[15px] font-bold text-slate-900">Cancel</Text>
        </Pressable>
        <Pressable
          testID="change-password-submit-button"
          className="justify-center items-center bg-primary-dark rounded-[18px]"
          style={[{ flex: 1.3, minHeight: 54 }, isSubmitDisabled ? { opacity: 0.55 } : undefined]}
          onPress={handleSave}
          disabled={isSubmitDisabled}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-[15px] font-extrabold text-white">Update password</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
