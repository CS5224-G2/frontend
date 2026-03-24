import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

export const styles = {
  // Colors
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  
  // Border radius
  radiusXs: 4,
  radiusSm: 6,
  radiusMd: 8,
  radiusLg: 12,
  radiusXl: 16,
  radiusFull: 9999,
};

interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export const Card = ({ children, style }: CardProps) => (
  <View style={[cardStyles.container, style]}>
    {children}
  </View>
);

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: styles.radiusMd,
    borderWidth: 1,
    borderColor: styles.borderColor,
    padding: styles.spacing.md,
    marginVertical: styles.spacing.sm,
  },
});

interface CardHeaderProps {
  children: React.ReactNode;
}

export const CardHeader = ({ children }: CardHeaderProps) => (
  <View style={cardHeaderStyles.container}>
    {children}
  </View>
);

const cardHeaderStyles = StyleSheet.create({
  container: {
    marginBottom: styles.spacing.md,
  },
});

interface CardTitleProps {
  children: React.ReactNode;
  style?: any;
}

export const CardTitle = ({ children, style }: CardTitleProps) => (
  <Text style={[cardTitleStyles.text, style]}>
    {children}
  </Text>
);

const cardTitleStyles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: styles.textPrimary,
  },
});

interface CardDescriptionProps {
  children: React.ReactNode;
}

export const CardDescription = ({ children }: CardDescriptionProps) => (
  <Text style={cardDescriptionStyles.text}>
    {children}
  </Text>
);

const cardDescriptionStyles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: styles.textSecondary,
    marginTop: styles.spacing.xs,
  },
});

interface CardContentProps {
  children: React.ReactNode;
}

export const CardContent = ({ children }: CardContentProps) => (
  <View style={cardContentStyles.container}>
    {children}
  </View>
);

const cardContentStyles = StyleSheet.create({
  container: {
    gap: styles.spacing.md,
  },
});

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
    style={({ pressed }) => [
      buttonStyles.base,
      variant === 'default' && buttonStyles.default,
      variant === 'secondary' && buttonStyles.secondary,
      variant === 'ghost' && buttonStyles.ghost,
      (disabled || loading) && buttonStyles.disabled,
      pressed && buttonStyles.pressed,
      style,
    ]}
  >
    {loading ? (
      <ActivityIndicator color="#ffffff" />
    ) : typeof children === 'string' ? (
      <Text style={buttonStyles.text}>{children}</Text>
    ) : (
      children
    )}
  </Pressable>
);

const buttonStyles = StyleSheet.create({
  base: {
    paddingHorizontal: styles.spacing.lg,
    paddingVertical: styles.spacing.md,
    borderRadius: styles.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  default: {
    backgroundColor: styles.primaryColor,
  },
  secondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: styles.borderColor,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
