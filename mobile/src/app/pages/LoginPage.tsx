import { useState, useContext } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
      await loginUser({
        email,
        password,
        rememberMe,
      });

      login();
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backgroundBubbleTop} />
          <View style={styles.backgroundBubbleBottom} />

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoGlyph}>CL</Text>
            </View>
            <Text style={styles.brand}>CycleLink</Text>
            <Text style={styles.subtitle}>Welcome back. Sign in to continue your next ride.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardDescription}>Choose your preferred sign-in method</Text>

            <Pressable style={styles.socialButton} onPress={() => Alert.alert('Google', 'Mock only')}>
              <View style={[styles.socialIcon, styles.googleIcon]}>
                <Text style={styles.socialIconText}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </Pressable>

            <Pressable style={styles.socialButton} onPress={() => Alert.alert('Apple', 'Mock only')}>
              <View style={[styles.socialIcon, styles.appleIcon]}>
                <Text style={[styles.socialIconText, styles.appleIconText]}>A</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable onPress={() => setShowPassword((current) => !current)}>
                  <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Pressable style={styles.checkboxRow} onPress={() => setRememberMe((current) => !current)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Text style={styles.checkboxTick}>x</Text> : null}
                </View>
                <Text style={styles.metaText}>Remember me</Text>
              </Pressable>

              <Pressable>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Do not have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#eef4ff',
  },
  backgroundBubbleTop: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#d8e6ff',
  },
  backgroundBubbleBottom: {
    position: 'absolute',
    bottom: 40,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#dbeafe',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  logoGlyph: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 18,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    backgroundColor: '#f1f5f9',
  },
  appleIcon: {
    backgroundColor: '#111827',
  },
  socialIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  appleIconText: {
    color: '#ffffff',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fbff',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fbff',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#0f172a',
  },
  toggleText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  metaText: {
    color: '#475569',
    fontSize: 13,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },
});