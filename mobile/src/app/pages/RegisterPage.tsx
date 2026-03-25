import { useState, useContext } from 'react';
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
import { AuthContext } from '../AuthContext';

import { registerUser } from '../../services/authService';

export default function RegisterPage() {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
  const { colorScheme } = useColorScheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Please complete every field before continuing.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Your password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        agreedToTerms,
      });

      login();
      // Navigation is now handled by RootNavigator reacting to AuthContext
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong while creating the account.';
      Alert.alert('Registration failed', message);
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="absolute top-5 left-[-40px] bg-bubble-top dark:bg-[#1e293b]"
            style={{ width: 180, height: 180, borderRadius: 90 }}
          />
          <View
            className="absolute bottom-10 right-[-60px] bg-bubble-bottom dark:bg-[#0f172a]"
            style={{ width: 220, height: 220, borderRadius: 110 }}
          />

          <View className="items-center mb-7">
            <View
              className="items-center justify-center mb-4 bg-primary dark:bg-blue-500"
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                shadowColor: '#1d4ed8',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.22,
                shadowRadius: 18,
                elevation: 8,
              }}
            >
              <Text className="text-white text-[22px] font-extrabold tracking-widest">CL</Text>
            </View>
            <Text className="text-[34px] font-extrabold text-[#2563eb] dark:text-blue-400 mb-2">CycleLink</Text>
            <Text
              className="text-[15px] leading-[22px] text-[#475569] dark:text-slate-400 text-center"
              style={{ maxWidth: 300 }}
            >
              Create your account to unlock smarter cycling routes.
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
            <Text className="text-[24px] font-bold text-slate-900 dark:text-slate-100 mb-1.5">Create Account</Text>
            <Text className="text-[14px] text-text-secondary mb-[18px]">Choose your preferred sign-up method</Text>

            <Pressable
              className="flex-row items-center justify-center border border-border-light dark:border-[#2d2d2d] rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-bg-base dark:bg-[#111111]"
              onPress={() => Alert.alert('Google', 'Mock only')}
            >
              <View
                className="items-center justify-center mr-3 bg-[#f1f5f9] dark:bg-[#1a1a1a]"
                style={{ width: 28, height: 28, borderRadius: 14 }}
              >
                <Text className="text-[14px] font-bold text-slate-900 dark:text-slate-100">G</Text>
              </View>
              <Text className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Continue with Google</Text>
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center border border-border-light dark:border-[#2d2d2d] rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-bg-base dark:bg-[#111111]"
              onPress={() => Alert.alert('Apple', 'Mock only')}
            >
              <View
                className="items-center justify-center mr-3 bg-[#111827]"
                style={{ width: 28, height: 28, borderRadius: 14 }}
              >
                <Text className="text-[14px] font-bold text-white">A</Text>
              </View>
              <Text className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Continue with Apple</Text>
            </Pressable>

            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-border dark:bg-[#2d2d2d]" />
              <Text className="mx-3 text-slate-400 dark:text-slate-400 text-[12px] font-semibold">Or sign up with email</Text>
              <View className="flex-1 h-px bg-border dark:bg-[#2d2d2d]" />
            </View>

            <View className="flex-row" style={{ marginHorizontal: -6 }}>
              <View className="flex-1 mb-4" style={{ marginHorizontal: 6 }}>
                <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">First Name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setFirstName}
                  placeholder="Alex"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                  className="border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]"
                  value={firstName}
                />
              </View>

              <View className="flex-1 mb-4" style={{ marginHorizontal: 6 }}>
                <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Last Name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setLastName}
                  placeholder="Johnson"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                  className="border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]"
                  value={lastName}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                className="border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]"
                value={email}
              />
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Password</Text>
              <View className="flex-row items-center border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg bg-bg-light dark:bg-[#1a1a1a]">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showPassword}
                  className="flex-1 py-[15px] text-[15px] text-slate-900 dark:text-slate-100"
                  value={password}
                />
                <Pressable onPress={() => setShowPassword((current) => !current)}>
                  <Text className="text-[#2563eb] dark:text-blue-400 text-[13px] font-bold">{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Confirm Password</Text>
              <View className="flex-row items-center border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg bg-bg-light dark:bg-[#1a1a1a]">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showConfirmPassword}
                  className="flex-1 py-[15px] text-[15px] text-slate-900 dark:text-slate-100"
                  value={confirmPassword}
                />
                <Pressable onPress={() => setShowConfirmPassword((current) => !current)}>
                  <Text className="text-[#2563eb] dark:text-blue-400 text-[13px] font-bold">{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              className="flex-row items-start mb-5"
              onPress={() => setAgreedToTerms((current) => !current)}
            >
              <View
                className={`items-center justify-center mr-[10px] mt-0.5 border rounded-cy-sm ${agreedToTerms ? 'bg-primary dark:bg-blue-500 border-primary dark:border-blue-500' : 'bg-bg-base dark:bg-[#111111] border-[#cbd5e1] dark:border-[#2d2d2d]'}`}
                style={{ width: 20, height: 20 }}
              >
                {agreedToTerms ? <Text className="text-white text-[11px] font-extrabold">x</Text> : null}
              </View>
              <Text className="flex-1 text-[#475569] dark:text-slate-400 text-[13px] leading-5">
                I agree to the <Text className="text-[#2563eb] dark:text-blue-400 text-[13px] font-bold">Terms of Service</Text> and{' '}
                <Text className="text-[#2563eb] dark:text-blue-400 text-[13px] font-bold">Privacy Policy</Text>.
              </Text>
            </Pressable>

            <Pressable
              disabled={isSubmitting}
              onPress={handleRegister}
              className="bg-primary dark:bg-blue-500 rounded-[18px] items-center justify-center py-cy-lg mb-[18px]"
              style={isSubmitting ? { opacity: 0.7 } : undefined}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-[16px] font-bold">Create Account</Text>
              )}
            </Pressable>

            <View className="flex-row justify-center items-center">
              <Text className="text-text-secondary text-[13px]">Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text className="text-[#2563eb] dark:text-blue-400 text-[13px] font-bold">Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
