/**
 * Card Component
 * Cross-platform card with consistent styling
 */

import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: keyof typeof import('@/constants/designTokens').spacing;
  children: React.ReactNode;
}

export function Card({ variant = 'default', padding = 'base', children, style, ...props }: CardProps) {
  const { colors, spacing, borderRadius, shadows } = useDesignSystem();

  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      padding: spacing[padding],
    };

    switch (variant) {
      case 'default':
        baseStyle.backgroundColor = colors.surface;
        break;
      case 'elevated':
        baseStyle.backgroundColor = colors.surfaceElevated;
        Object.assign(baseStyle, shadows.md);
        break;
      case 'outlined':
        baseStyle.backgroundColor = colors.background;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.border;
        break;
    }

    return baseStyle;
  };

  return (
    <View style={[getCardStyles(), style]} {...props}>
      {children}
    </View>
  );
}


