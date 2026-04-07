import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';

import { resetPassword } from '@/services/authService';

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry: boolean;
  onToggleVisibility: () => void;
  placeholderTextColor: string;
  helperText?: string;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  onToggleVisibility,
  placeholderTextColor,
  helperText,
}: PasswordFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-[#334155] dark:text-slate-100">{label}</Text>
      <View className="flex-row items-center border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg bg-bg-light dark:bg-[#1a1a1a]">
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 py-[15px] text-[15px] text-[#0f172a] dark:text-slate-100"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          value={value}
        />
        <Pressable onPress={onToggleVisibility} hitSlop={12}>
          <Text className="text-primary dark:text-blue-400 text-[13px] font-bold">
            {secureTextEntry ? 'Show' : 'Hide'}
          </Text>
        </Pressable>
      </View>
      {helperText ? (
        <Text className="text-[13px] leading-[18px] text-text-secondary dark:text-slate-400">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export default function ResetPasswordPage() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useColorScheme();
  const placeholderTextColor = colorScheme === 'dark' ? '#64748b' : '#94a3b8';

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = !confirmPassword.length || newPassword === confirmPassword;
  const isSubmitDisabled =
    isSubmitting ||
    !token.trim() ||
    !newPassword.trim() ||
    !confirmPassword.trim() ||
    !passwordsMatch;

  const handleSubmit = async () => {
    if (!token.trim()) {
      Alert.alert('Reset token required', 'Paste the token from your email before continuing.');
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing information', 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure the new passwords are identical.');
      return;
    }

    if (newPassword.trim().length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters for the new password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const message = await resetPassword(token, newPassword);
      Alert.alert('Password reset', message, [
        {
          text: 'Back to sign in',
          onPress: () => navigation.navigate('login'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to reset password',
        error instanceof Error ? error.message : 'Please try again later.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page dark:bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 w-full self-center justify-center" style={{ maxWidth: 520 }}>
            <View
              className="absolute rounded-full bg-bubble-top dark:bg-[#1e293b]"
              style={{ top: 20, right: -40, width: 180, height: 180 }}
            />
            <View
              className="absolute rounded-full bg-bubble-bottom dark:bg-[#0f172a]"
              style={{ bottom: 40, left: -60, width: 220, height: 220 }}
            />

            <View className="items-center mb-7">
              <View
                className="bg-primary dark:bg-blue-500 items-center justify-center mb-cy-lg rounded-full"
                style={{
                  width: 72,
                  height: 72,
                  shadowColor: '#1d4ed8',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.22,
                  shadowRadius: 18,
                  elevation: 8,
                }}
              >
                <Text className="text-white text-[22px] font-extrabold tracking-[1px]">CL</Text>
              </View>
              <Text className="text-[34px] font-extrabold text-primary dark:text-blue-400 mb-2">
                CycleLink
              </Text>
              <Text
                className="text-[15px] leading-[22px] text-[#475569] dark:text-slate-400 text-center"
                style={{ maxWidth: 320 }}
              >
                Paste the reset token from your email and choose a new password for your account.
              </Text>
            </View>

            <View
              className="bg-bg-base dark:bg-[#111111] rounded-cy-2xl px-[22px] py-cy-xl"
              style={{
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.08,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <Text className="text-2xl font-bold text-[#0f172a] dark:text-slate-100 mb-1.5">
                Reset password
              </Text>
              <Text className="text-sm text-text-secondary mb-[18px]">
                Tokens expire after 15 minutes. If yours has expired, request a fresh one.
              </Text>

              <View className="mb-cy-lg">
                <Text className="text-sm font-semibold text-[#334155] dark:text-slate-100 mb-2">
                  Reset token
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-[#0f172a] dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]"
                  multiline
                  numberOfLines={4}
                  onChangeText={setToken}
                  placeholder="Paste the token from your email"
                  placeholderTextColor={placeholderTextColor}
                  style={{ minHeight: 104, textAlignVertical: 'top' }}
                  value={token}
                />
              </View>

              <View className="mb-cy-lg">
                <PasswordField
                  helperText="Use at least 8 characters. Uppercase letters and numbers are recommended."
                  label="New password"
                  onChangeText={setNewPassword}
                  onToggleVisibility={() => setShowNewPassword((value) => !value)}
                  placeholder="Enter new password"
                  placeholderTextColor={placeholderTextColor}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                />
              </View>

              <PasswordField
                label="Confirm new password"
                onChangeText={setConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
                placeholder="Re-enter new password"
                placeholderTextColor={placeholderTextColor}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
              />

              {!passwordsMatch ? (
                <Text className="mt-3 text-[13px] font-semibold text-[#DC2626]">
                  Confirmation must match the new password.
                </Text>
              ) : null}

              <Pressable
                disabled={isSubmitDisabled}
                onPress={handleSubmit}
                testID="reset-password-submit-button"
                className={`bg-primary dark:bg-blue-500 rounded-[18px] items-center justify-center py-cy-lg mt-5${isSubmitDisabled ? ' opacity-60' : ''}`}
                style={(state: any) => [
                  Platform.OS === 'web' && !isSubmitDisabled && state.hovered && {
                    backgroundColor: '#1d4ed8',
                    transform: [{ scale: 1.02 }],
                  },
                  !isSubmitDisabled && state.pressed && {
                    opacity: 0.8,
                    transform: [{ scale: 0.98 }],
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-bold">Set new password</Text>
                )}
              </Pressable>

              <View className="flex-row items-center justify-between mt-5">
                <Pressable onPress={() => navigation.navigate('forgot-password')}>
                  <Text className="text-[13px] font-bold text-primary dark:text-blue-400">
                    Request another token
                  </Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('login')}>
                  <Text className="text-[13px] font-bold text-primary dark:text-blue-400">
                    Back to sign in
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
