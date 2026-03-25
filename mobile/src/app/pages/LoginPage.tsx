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

import { loginUser } from '../../services/authService';

export default function LoginPage() {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser({
        email,
        password,
        rememberMe,
      });

      login(result.user.role);
      // Navigation is now handled by RootNavigator reacting to AuthContext
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong while signing in.';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page">
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
            <View
              className="absolute rounded-full bg-bubble-top"
              style={{ top: 20, right: -40, width: 180, height: 180 }}
            />
            <View
              className="absolute rounded-full bg-bubble-bottom"
              style={{ bottom: 40, left: -60, width: 220, height: 220 }}
            />

            <View className="items-center mb-7">
              <View
                className="bg-primary items-center justify-center mb-cy-lg rounded-full"
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
              <Text className="text-[34px] font-extrabold text-primary mb-2">CycleLink</Text>
              <Text className="text-[15px] leading-[22px] text-[#475569] text-center" style={{ maxWidth: 280 }}>
                Welcome back. Sign in to continue your next ride.
              </Text>
            </View>

            <View
              className="bg-bg-base rounded-cy-2xl px-[22px] py-cy-xl"
              style={{
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.08,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <Text className="text-2xl font-bold text-[#0f172a] mb-1.5">Sign In</Text>
              <Text className="text-sm text-text-secondary mb-[18px]">Choose your preferred sign-in method</Text>

              <Pressable
                className="flex-row items-center justify-center border border-border-light rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-bg-base"
                onPress={() => Alert.alert('Google', 'Mock only')}
              >
                <View className="w-7 h-7 rounded-full items-center justify-center mr-3 bg-[#f1f5f9]">
                  <Text className="text-sm font-bold text-[#0f172a]">G</Text>
                </View>
                <Text className="text-[15px] font-semibold text-[#0f172a]">Continue with Google</Text>
              </Pressable>

              <Pressable
                className="flex-row items-center justify-center border border-border-light rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-bg-base"
                onPress={() => Alert.alert('Apple', 'Mock only')}
              >
                <View className="w-7 h-7 rounded-full items-center justify-center mr-3 bg-[#111827]">
                  <Text className="text-sm font-bold text-white">A</Text>
                </View>
                <Text className="text-[15px] font-semibold text-[#0f172a]">Continue with Apple</Text>
              </Pressable>

              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-border" />
                <Text className="mx-3 text-[#94a3b8] text-xs font-semibold">Or continue with email</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              <View className="mb-cy-lg">
                <Text className="text-sm font-semibold text-[#334155] mb-2">Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#94a3b8"
                  className="border border-border-light rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-[#0f172a] bg-bg-light"
                  value={email}
                  returnKeyType="next"
                />
              </View>

              <View className="mb-cy-lg">
                <Text className="text-sm font-semibold text-[#334155] mb-2">Password</Text>
                <View className="flex-row items-center border border-border-light rounded-cy-xl px-cy-lg bg-bg-light">
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    className="flex-1 py-[15px] text-[15px] text-[#0f172a]"
                    value={password}
                  />
                  <Pressable onPress={() => setShowPassword((current) => !current)}>
                    <Text className="text-primary text-[13px] font-bold">{showPassword ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-5">
                <Pressable
                  className="flex-row items-center"
                  onPress={() => setRememberMe((current) => !current)}
                >
                  <View
                    className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${
                      rememberMe ? 'bg-primary border-primary' : 'bg-bg-base border-[#cbd5e1]'
                    }`}
                  >
                    {rememberMe ? <Text className="text-white text-[11px] font-extrabold">x</Text> : null}
                  </View>
                  <Text className="text-[#475569] text-[13px]">Remember me</Text>
                </Pressable>

                <Pressable>
                  <Text className="text-primary text-[13px] font-bold">Forgot password?</Text>
                </Pressable>
              </View>

              <Pressable
                disabled={isSubmitting}
                onPress={handleLogin}
                className={`bg-primary rounded-[18px] items-center justify-center py-cy-lg mb-[18px]${isSubmitting ? ' opacity-70' : ''}`}
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
                  <Text className="text-white text-base font-bold">Sign In</Text>
                )}
              </Pressable>
            </View>

            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-text-secondary text-[13px]">Do not have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text className="text-primary text-[13px] font-bold">Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
