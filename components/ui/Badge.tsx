/**
 * Badge Component
 * Cross-platform badge for labels and status indicators
 */

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ variant = 'default', size = 'md', children, style, textStyle }: BadgeProps) {
  const { colors, typography, spacing, borderRadius } = useDesignSystem();

  const getBadgeStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = spacing.xs / 2;
        baseStyle.paddingHorizontal = spacing.sm;
        break;
      case 'md':
        baseStyle.paddingVertical = spacing.xs;
        baseStyle.paddingHorizontal = spacing.sm;
        break;
      case 'lg':
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.backgroundColor = colors.surface;
        break;
      case 'primary':
        baseStyle.backgroundColor = colors.primary;
        break;
      case 'success':
        baseStyle.backgroundColor = colors.success;
        break;
      case 'warning':
        baseStyle.backgroundColor = colors.warning;
        break;
      case 'error':
        baseStyle.backgroundColor = colors.error;
        break;
      case 'info':
        baseStyle.backgroundColor = colors.info;
        break;
    }

    return baseStyle;
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: typography.fontWeight.medium,
    };
    
    if (typography.fontFamily.medium) {
      baseStyle.fontFamily = typography.fontFamily.medium;
    }

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.fontSize = typography.fontSize.xs;
        baseStyle.lineHeight = typography.lineHeight.xs;
        break;
      case 'md':
        baseStyle.fontSize = typography.fontSize.sm;
        baseStyle.lineHeight = typography.lineHeight.sm;
        break;
      case 'lg':
        baseStyle.fontSize = typography.fontSize.base;
        baseStyle.lineHeight = typography.lineHeight.base;
        break;
    }

    // Variant text colors
    if (variant === 'default') {
      baseStyle.color = colors.text;
    } else {
      baseStyle.color = '#FFFFFF';
    }

    return baseStyle;
  };

  return (
    <View style={[getBadgeStyles(), style]}>
      <Text style={[getTextStyles(), textStyle]}>{children}</Text>
    </View>
  );
}

