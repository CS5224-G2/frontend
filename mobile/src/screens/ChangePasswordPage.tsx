import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { updatePassword } from '@/services/settingsService';

const theme = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  primary: '#1D4ED8',
  primarySoft: '#DBEAFE',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#15803D',
};

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
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable onPress={onToggleVisibility} hitSlop={12}>
          <Text style={styles.visibilityText}>{secureTextEntry ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!newPassword.length) {
      return { label: 'Enter a new password', color: theme.textMuted, fillPercent: 0 };
    }

    if (newPassword.length < 8) {
      return { label: 'Weak password', color: theme.danger, fillPercent: 33 };
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { label: 'Fair password', color: theme.warning, fillPercent: 66 };
    }

    return { label: 'Strong password', color: theme.success, fillPercent: 100 };
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
          onPress: () => router.back(),
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'Change password' }} />
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Security</Text>
        <Text style={styles.heroTitle}>Change password</Text>
        <Text style={styles.heroSubtitle}>
          Update your account credentials and keep your CycleLink profile secure.
        </Text>
      </View>

      <View style={styles.sectionCard}>
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

        <View style={styles.strengthBlock}>
          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${passwordStrength.fillPercent}%`,
                  backgroundColor: passwordStrength.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
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
          <Text style={styles.errorText}>Confirmation must match the new password.</Text>
        ) : null}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Security tip</Text>
        <Text style={styles.tipBody}>
          The mock backend password is currently set to `CycleLink123` for demo purposes.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitDisabled}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Update password</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.primary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: theme.textMuted,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceMuted,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  visibilityText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.textMuted,
  },
  strengthBlock: {
    gap: 8,
  },
  strengthTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 999,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.danger,
  },
  tipCard: {
    backgroundColor: theme.primarySoft,
    borderRadius: 20,
    padding: 18,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  primaryButton: {
    flex: 1.3,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
