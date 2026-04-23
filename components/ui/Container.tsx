/**
 * Container Component
 * Cross-platform container with consistent padding and max-width
 */

import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export interface ContainerProps extends ViewProps {
  padding?: keyof typeof import('@/constants/designTokens').spacing;
  paddingHorizontal?: keyof typeof import('@/constants/designTokens').spacing;
  paddingVertical?: keyof typeof import('@/constants/designTokens').spacing;
  children: React.ReactNode;
}

export function Container({
  padding,
  paddingHorizontal,
  paddingVertical,
  children,
  style,
  ...props
}: ContainerProps) {
  const { colors, spacing } = useDesignSystem();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.background,
  };

  if (padding) {
    containerStyle.padding = spacing[padding];
  } else {
    if (paddingHorizontal) {
      containerStyle.paddingHorizontal = spacing[paddingHorizontal];
    }
    if (paddingVertical) {
      containerStyle.paddingVertical = spacing[paddingVertical];
    }
  }

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
}


