import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { styles } from './Common';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: any;
}

export const Input = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  keyboardType = 'default',
  style,
}: InputProps) => (
  <TextInput
    style={[inputStyles.input, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={styles.textSecondary}
    secureTextEntry={secureTextEntry}
    editable={editable}
    keyboardType={keyboardType}
  />
);

const inputStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: styles.borderColor,
    borderRadius: styles.radiusMd,
    paddingHorizontal: styles.spacing.md,
    paddingVertical: styles.spacing.md,
    fontSize: 14,
    color: styles.textPrimary,
    backgroundColor: '#ffffff',
  },
});

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

export const Label = ({ children, htmlFor }: LabelProps) => (
  <Text style={labelStyles.text}>
    {children}
  </Text>
);

const labelStyles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: styles.textPrimary,
    marginBottom: styles.spacing.sm,
  },
});

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive';
  style?: any;
}

export const Badge = ({ children, variant = 'default', style }: BadgeProps) => (
  <View style={[badgeStyles.base, badgeStyles[variant], style]}>
    <Text style={badgeStyles.text}>
      {typeof children === 'string' ? children : children}
    </Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  base: {
    paddingHorizontal: styles.spacing.md,
    paddingVertical: styles.spacing.xs,
    borderRadius: styles.radiusFull,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: styles.primaryColor,
  },
  secondary: {
    backgroundColor: '#e2e8f0',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

interface SeparatorProps {
  style?: any;
}

export const Separator = ({ style }: SeparatorProps) => (
  <View style={[separatorStyles.line, style]} />
);

const separatorStyles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: styles.borderColor,
    marginVertical: styles.spacing.md,
  },
});

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = ({ value, onValueChange, disabled }: CheckboxProps) => (
  <Pressable
    onPress={() => !disabled && onValueChange(!value)}
    style={[
      checkboxStyles.box,
      value && checkboxStyles.checked,
      disabled && checkboxStyles.disabled,
    ]}
  >
    {value && <Text style={checkboxStyles.checkmark}>✓</Text>}
  </Pressable>
);

const checkboxStyles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: styles.borderColor,
    borderRadius: styles.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checked: {
    backgroundColor: styles.primaryColor,
    borderColor: styles.primaryColor,
  },
  checkmark: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});
