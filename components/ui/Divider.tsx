/**
 * Divider Component
 * Cross-platform divider line
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export interface DividerProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: keyof typeof import('@/constants/designTokens').spacing;
}

export function Divider({ orientation = 'horizontal', spacing: spacingKey, style, ...props }: DividerProps) {
  const { colors, spacing } = useDesignSystem();

  const dividerStyle: ViewStyle = {
    backgroundColor: colors.divider,
  };

  if (orientation === 'horizontal') {
    dividerStyle.height = 1;
    dividerStyle.width = '100%';
    if (spacingKey) {
      dividerStyle.marginVertical = spacing[spacingKey];
    }
  } else {
    dividerStyle.width = 1;
    dividerStyle.height = '100%';
    if (spacingKey) {
      dividerStyle.marginHorizontal = spacing[spacingKey];
    }
  }

  return <View style={[dividerStyle, style]} {...props} />;
}


