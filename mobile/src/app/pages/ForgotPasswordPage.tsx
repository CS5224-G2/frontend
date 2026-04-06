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
import { httpClient } from '../../services/httpClient';

async function requestPasswordReset(email: string): Promise<void> {
  await httpClient.post<void>('/auth/forgot-password', { email });
}

export default function ForgotPasswordPage() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(trimmed);
      setSubmitted(true);
    } catch {
      // Show success even on error to avoid user enumeration
      setSubmitted(true);
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
          <View className="flex-1 w-full self-center justify-center" style={{ maxWidth: 480 }}>
            {/* Decorative blobs */}
            <View
              className="absolute rounded-full bg-bubble-top dark:bg-[#1e293b]"
              style={{ top: 20, right: -40, width: 180, height: 180 }}
            />
            <View
              className="absolute rounded-full bg-bubble-bottom dark:bg-[#0f172a]"
              style={{ bottom: 40, left: -60, width: 220, height: 220 }}
            />

            {/* Header */}
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
                style={{ maxWidth: 280 }}
              >
                {submitted
                  ? 'Check your inbox for further instructions.'
                  : "Enter your email and we'll send you a reset link."}
              </Text>
            </View>

            {/* Card */}
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
                Forgot password
              </Text>
              <Text className="text-sm text-text-secondary mb-[18px]">
                We'll send a reset link to your email address
              </Text>

              {submitted ? (
                <View className="items-center py-6" style={{ gap: 12 }}>
                  <View
                    className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center"
                    style={{
                      shadowColor: '#15803d',
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-[28px]">✓</Text>
                  </View>
                  <Text className="text-[17px] font-bold text-slate-900 dark:text-slate-100 text-center">
                    Reset link sent
                  </Text>
                  <Text className="text-[14px] leading-[21px] text-text-secondary dark:text-slate-400 text-center">
                    If an account exists for{' '}
                    <Text className="font-bold text-primary dark:text-blue-400">{email.trim()}</Text>
                    , you'll receive an email shortly.
                  </Text>
                  <Pressable
                    className="mt-2 bg-primary dark:bg-blue-500 rounded-[18px] items-center justify-center py-cy-lg w-full"
                    onPress={() => navigation.goBack()}
                  >
                    <Text className="text-white text-base font-bold">Back to sign in</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View className="mb-cy-lg">
                    <Text className="text-sm font-semibold text-[#334155] dark:text-slate-100 mb-2">
                      Email address
                    </Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-[#0f172a] dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]"
                      value={email}
                      returnKeyType="send"
                      onSubmitEditing={handleSubmit}
                      autoFocus
                    />
                  </View>

                  <Pressable
                    disabled={isSubmitting}
                    onPress={handleSubmit}
                    className={`bg-primary dark:bg-blue-500 rounded-[18px] items-center justify-center py-cy-lg mb-[18px]${isSubmitting ? ' opacity-70' : ''}`}
                    style={(state: any) => [
                      Platform.OS === 'web' && state.hovered && {
                        backgroundColor: '#1d4ed8',
                        transform: [{ scale: 1.02 }],
                      },
                      state.pressed && {
                        opacity: 0.8,
                        transform: [{ scale: 0.98 }],
                      },
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white text-base font-bold">Send reset link</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>

            {!submitted && (
              <View className="flex-row justify-center items-center mt-4">
                <Text className="text-text-secondary text-[13px]">Remember your password? </Text>
                <Pressable onPress={() => navigation.goBack()}>
                  <Text className="text-primary dark:text-blue-400 text-[13px] font-bold">
                    Sign in
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
