import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

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
    className="border border-border rounded-cy-md px-cy-md py-cy-md text-sm text-text-primary bg-bg-base"
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#94a3b8"
    secureTextEntry={secureTextEntry}
    editable={editable}
    keyboardType={keyboardType}
    style={style}
  />
);

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

export const Label = ({ children, htmlFor }: LabelProps) => (
  <Text className="text-sm font-medium text-text-primary mb-cy-sm">
    {children}
  </Text>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive';
  style?: any;
}

export const Badge = ({ children, variant = 'default', style }: BadgeProps) => (
  <View
    className={[
      'px-cy-md py-cy-xs rounded-full self-start',
      variant === 'default' ? 'bg-primary' : '',
      variant === 'secondary' ? 'bg-slate-200' : '',
      variant === 'destructive' ? 'bg-red-500' : '',
    ].filter(Boolean).join(' ')}
    style={style}
  >
    <Text className="text-white text-xs font-semibold">
      {typeof children === 'string' ? children : children}
    </Text>
  </View>
);

interface SeparatorProps {
  style?: any;
}

export const Separator = ({ style }: SeparatorProps) => (
  <View className="h-px bg-border my-cy-md" style={style} />
);

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = ({ value, onValueChange, disabled }: CheckboxProps) => (
  <Pressable
    onPress={() => !disabled && onValueChange(!value)}
    className={[
      'w-5 h-5 border rounded-cy-sm justify-center items-center bg-bg-base',
      value ? 'bg-primary border-primary' : 'border-border',
      disabled ? 'opacity-50' : '',
    ].filter(Boolean).join(' ')}
  >
    {value && <Text className="text-white font-bold">✓</Text>}
  </Pressable>
);
