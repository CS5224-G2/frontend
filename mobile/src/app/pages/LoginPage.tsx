import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/native/Common';
import { Input, Label, Checkbox, Separator } from '../components/native/FormComponents';
import { Button } from '../components/native/Common';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AuthScreenNavigationProp = NativeStackNavigationProp<any, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Welcome back!');
      navigation.navigate('Onboarding');
    }, 1000);
  };

  const handleGoogleLogin = () => {
    Alert.alert('Info', 'Google sign-in would open here');
    setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 1000);
  };

  const handleAppleLogin = () => {
    Alert.alert('Info', 'Apple sign-in would open here');
    setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Logo and Title */}
      <View style={styles.headerContainer}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="bike" size={40} color="#ffffff" />
        </View>
        <Text style={styles.appTitle}>CycleLink</Text>
        <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
      </View>

      {/* Login Card */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Choose your preferred sign-in method</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <Button onPress={handleGoogleLogin} style={styles.socialButton}>
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialButtonText}>Google</Text>
              </View>
            </Button>

            <Button onPress={handleAppleLogin} style={styles.socialButton}>
              <View style={styles.socialButtonContent}>
                <MaterialCommunityIcons name="apple" size={20} color="#ffffff" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </View>
            </Button>
          </View>

          <Separator />

          {/* Email Login Form */}
          <View style={styles.formContainer}>
            <View>
              <Label>Email</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Label>Password</Label>
              <View style={styles.passwordInputContainer}>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  style={{ flex: 1 }}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.rememberForgotContainer}>
              <View style={styles.rememberMeContainer}>
                <Checkbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>
              <Pressable>
                <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
              </Pressable>
            </View>

            <Button
              onPress={handleEmailLogin}
              disabled={isLoading}
              loading={isLoading}
              style={styles.signInButton}
            >
              {isLoading ? '' : 'Sign In'}
            </Button>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>

      {/* Skip for Demo */}
      <Button
        onPress={() => navigation.navigate('Onboarding')}
        variant="ghost"
        style={styles.skipButton}
      >
        <Text style={styles.skipButtonText}>Skip and explore demo</Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  card: {
    marginBottom: 16,
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  socialButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  socialButtonText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    gap: 16,
    marginTop: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666666',
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  signInButton: {
    marginTop: 8,
  },
  signUpContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#666666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 8,
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 14,
  },
});

