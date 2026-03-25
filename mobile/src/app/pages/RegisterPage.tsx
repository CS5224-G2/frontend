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
import { AuthContext } from '../AuthContext';

import { registerUser } from '../../services/authService';

export default function RegisterPage() {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
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
    <SafeAreaView className="flex-1 bg-[#eef4ff]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#eef4ff' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="absolute top-5 left-[-40px]"
            style={{ width: 180, height: 180, borderRadius: 90, backgroundColor: '#d8e6ff' }}
          />
          <View
            className="absolute bottom-10 right-[-60px]"
            style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: '#dbeafe' }}
          />

          <View className="items-center mb-7">
            <View
              className="items-center justify-center mb-4"
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#2563eb',
                shadowColor: '#1d4ed8',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.22,
                shadowRadius: 18,
                elevation: 8,
              }}
            >
              <Text className="text-white text-[22px] font-extrabold tracking-widest">CL</Text>
            </View>
            <Text className="text-[34px] font-extrabold text-[#2563eb] mb-2">CycleLink</Text>
            <Text
              className="text-[15px] leading-[22px] text-[#475569] text-center"
              style={{ maxWidth: 300 }}
            >
              Create your account to unlock smarter cycling routes.
            </Text>
          </View>

          <View
            className="bg-white rounded-cy-2xl px-[22px] py-cy-xl"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <Text className="text-[24px] font-bold text-slate-900 mb-1.5">Create Account</Text>
            <Text className="text-[14px] text-text-secondary mb-[18px]">Choose your preferred sign-up method</Text>

            <Pressable
              className="flex-row items-center justify-center border border-[#dbe3f0] rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-white"
              onPress={() => Alert.alert('Google', 'Mock only')}
            >
              <View
                className="items-center justify-center mr-3 bg-slate-100"
                style={{ width: 28, height: 28, borderRadius: 14 }}
              >
                <Text className="text-[14px] font-bold text-slate-900">G</Text>
              </View>
              <Text className="text-[15px] font-semibold text-slate-900">Continue with Google</Text>
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center border border-[#dbe3f0] rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-white"
              onPress={() => Alert.alert('Apple', 'Mock only')}
            >
              <View
                className="items-center justify-center mr-3 bg-[#111827]"
                style={{ width: 28, height: 28, borderRadius: 14 }}
              >
                <Text className="text-[14px] font-bold text-white">A</Text>
              </View>
              <Text className="text-[15px] font-semibold text-slate-900">Continue with Apple</Text>
            </Pressable>

            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="mx-3 text-slate-400 text-[12px] font-semibold">Or sign up with email</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <View className="flex-row" style={{ marginHorizontal: -6 }}>
              <View className="flex-1 mb-4" style={{ marginHorizontal: 6 }}>
                <Text className="text-[14px] font-semibold text-[#334155] mb-2">First Name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setFirstName}
                  placeholder="Alex"
                  placeholderTextColor="#94a3b8"
                  className="border border-[#dbe3f0] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 bg-[#f8fbff]"
                  value={firstName}
                />
              </View>

              <View className="flex-1 mb-4" style={{ marginHorizontal: 6 }}>
                <Text className="text-[14px] font-semibold text-[#334155] mb-2">Last Name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setLastName}
                  placeholder="Johnson"
                  placeholderTextColor="#94a3b8"
                  className="border border-[#dbe3f0] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 bg-[#f8fbff]"
                  value={lastName}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] mb-2">Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                className="border border-[#dbe3f0] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 bg-[#f8fbff]"
                value={email}
              />
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] mb-2">Password</Text>
              <View className="flex-row items-center border border-[#dbe3f0] rounded-cy-xl px-cy-lg bg-[#f8fbff]">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  className="flex-1 py-[15px] text-[15px] text-slate-900"
                  value={password}
                />
                <Pressable onPress={() => setShowPassword((current) => !current)}>
                  <Text className="text-[#2563eb] text-[13px] font-bold">{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] mb-2">Confirm Password</Text>
              <View className="flex-row items-center border border-[#dbe3f0] rounded-cy-xl px-cy-lg bg-[#f8fbff]">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  className="flex-1 py-[15px] text-[15px] text-slate-900"
                  value={confirmPassword}
                />
                <Pressable onPress={() => setShowConfirmPassword((current) => !current)}>
                  <Text className="text-[#2563eb] text-[13px] font-bold">{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              className="flex-row items-start mb-5"
              onPress={() => setAgreedToTerms((current) => !current)}
            >
              <View
                className={`items-center justify-center mr-[10px] mt-0.5 border rounded-cy-sm ${agreedToTerms ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-white border-[#cbd5e1]'}`}
                style={{ width: 20, height: 20 }}
              >
                {agreedToTerms ? <Text className="text-white text-[11px] font-extrabold">x</Text> : null}
              </View>
              <Text className="flex-1 text-[#475569] text-[13px] leading-5">
                I agree to the <Text className="text-[#2563eb] text-[13px] font-bold">Terms of Service</Text> and{' '}
                <Text className="text-[#2563eb] text-[13px] font-bold">Privacy Policy</Text>.
              </Text>
            </Pressable>

            <Pressable
              disabled={isSubmitting}
              onPress={handleRegister}
              className="bg-primary rounded-[18px] items-center justify-center py-cy-lg mb-[18px]"
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
                <Text className="text-[#2563eb] text-[13px] font-bold">Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
