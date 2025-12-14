/**
 * Avatar Component
 * Cross-platform avatar with consistent sizing
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: { uri: string } | number;
  label?: string;
  size?: AvatarSize;
  variant?: 'circular' | 'rounded';
  style?: ViewStyle;
}

export function Avatar({ source, label, size = 'md', variant = 'circular', style }: AvatarProps) {
  const { colors, typography, spacing, borderRadius } = useDesignSystem();

  const getSize = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 48;
      case 'lg':
        return 64;
      case 'xl':
        return 96;
      default:
        return 48;
    }
  };

  const avatarSize = getSize();
  const borderRadiusValue = variant === 'circular' ? avatarSize / 2 : borderRadius.md;

  const avatarStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: borderRadiusValue,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const imageStyle: ImageStyle = {
    width: avatarSize,
    height: avatarSize,
  };

  const textStyle: TextStyle = {
    fontSize: avatarSize * 0.4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    ...(typography.fontFamily.semibold && { fontFamily: typography.fontFamily.semibold }),
  };

  return (
    <View style={[avatarStyle, style]}>
      {source ? (
        <Image source={source} style={imageStyle} resizeMode="cover" />
      ) : label ? (
        <Text style={textStyle} numberOfLines={1}>
          {label.charAt(0).toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}

