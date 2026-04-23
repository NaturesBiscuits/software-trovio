/**
 * Button Component
 * Cross-platform button with consistent styling
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { colors, typography, spacing, borderRadius, opacity } = useDesignSystem();

  const isDisabled = disabled || loading;

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: isDisabled ? opacity.disabled : 1,
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        break;
      case 'md':
        baseStyle.paddingVertical = spacing.md;
        baseStyle.paddingHorizontal = spacing.base;
        break;
      case 'lg':
        baseStyle.paddingVertical = spacing.lg;
        baseStyle.paddingHorizontal = spacing.xl;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.surface;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.border;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'danger':
        baseStyle.backgroundColor = colors.error;
        break;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: typography.fontWeight.semibold,
    };
    
    if (typography.fontFamily.semibold) {
      baseStyle.fontFamily = typography.fontFamily.semibold;
    }

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.fontSize = typography.fontSize.sm;
        baseStyle.lineHeight = typography.lineHeight.sm;
        break;
      case 'md':
        baseStyle.fontSize = typography.fontSize.base;
        baseStyle.lineHeight = typography.lineHeight.base;
        break;
      case 'lg':
        baseStyle.fontSize = typography.fontSize.lg;
        baseStyle.lineHeight = typography.lineHeight.lg;
        break;
    }

    // Variant text colors
    switch (variant) {
      case 'primary':
      case 'danger':
        baseStyle.color = '#FFFFFF';
        break;
      case 'secondary':
        baseStyle.color = colors.text;
        break;
      case 'outline':
        baseStyle.color = colors.primary;
        break;
      case 'ghost':
        baseStyle.color = colors.primary;
        break;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      disabled={isDisabled}
      activeOpacity={opacity.pressed}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <Text style={[getTextStyles(), textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

