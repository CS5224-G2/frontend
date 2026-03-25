import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';


interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export const Card = ({ children, style }: CardProps) => (
  <View className="bg-bg-base dark:bg-[#111111] rounded-cy-md border border-border dark:border-[#2d2d2d] p-cy-md my-cy-sm" style={style}>
    {children}
  </View>
);

interface CardHeaderProps {
  children: React.ReactNode;
}

export const CardHeader = ({ children }: CardHeaderProps) => (
  <View className="mb-cy-md">
    {children}
  </View>
);

interface CardTitleProps {
  children: React.ReactNode;
  style?: any;
}

export const CardTitle = ({ children, style }: CardTitleProps) => (
  <Text className="text-xl font-semibold text-text-primary dark:text-slate-100" style={style}>
    {children}
  </Text>
);

interface CardDescriptionProps {
  children: React.ReactNode;
}

export const CardDescription = ({ children }: CardDescriptionProps) => (
  <Text className="text-sm text-text-secondary dark:text-slate-400 mt-cy-xs">
    {children}
  </Text>
);

interface CardContentProps {
  children: React.ReactNode;
}

export const CardContent = ({ children }: CardContentProps) => (
  <View className="gap-cy-md">
    {children}
  </View>
);

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export const Button = ({ onPress, children, variant = 'default', disabled = false, loading = false, style }: ButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    className={[
      'px-cy-lg py-cy-md rounded-cy-md justify-center items-center',
      variant === 'default' ? 'bg-primary dark:bg-blue-500' : '',
      variant === 'secondary' ? 'bg-slate-100 dark:bg-[#1a1a1a] border border-border dark:border-[#2d2d2d]' : '',
      variant === 'ghost' ? 'bg-transparent' : '',
      (disabled || loading) ? 'opacity-50' : '',
    ].filter(Boolean).join(' ')}
    style={({ pressed }) => [
      pressed && { opacity: 0.8 },
      style,
    ]}
  >
    {loading ? (
      <ActivityIndicator color="#ffffff" />
    ) : typeof children === 'string' ? (
      <Text className="text-white text-sm font-semibold">{children}</Text>
    ) : (
      children
    )}
  </Pressable>
);
