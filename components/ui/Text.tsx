/**
 * Text Component
 * Cross-platform text with design system typography
 */

import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface UITextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  weight,
  color,
  align,
  children,
  style,
  ...props
}: UITextProps) {
  const { colors, typography } = useDesignSystem();

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {};

    // Variant styles
    switch (variant) {
      case 'h1':
        baseStyle.fontSize = typography.fontSize['5xl'];
        baseStyle.lineHeight = typography.lineHeight['5xl'];
        baseStyle.fontWeight = typography.fontWeight.bold;
        if (typography.fontFamily.bold) {
          baseStyle.fontFamily = typography.fontFamily.bold;
        }
        break;
      case 'h2':
        baseStyle.fontSize = typography.fontSize['4xl'];
        baseStyle.lineHeight = typography.lineHeight['4xl'];
        baseStyle.fontWeight = typography.fontWeight.bold;
        if (typography.fontFamily.bold) {
          baseStyle.fontFamily = typography.fontFamily.bold;
        }
        break;
      case 'h3':
        baseStyle.fontSize = typography.fontSize['3xl'];
        baseStyle.lineHeight = typography.lineHeight['3xl'];
        baseStyle.fontWeight = typography.fontWeight.bold;
        if (typography.fontFamily.bold) {
          baseStyle.fontFamily = typography.fontFamily.bold;
        }
        break;
      case 'h4':
        baseStyle.fontSize = typography.fontSize['2xl'];
        baseStyle.lineHeight = typography.lineHeight['2xl'];
        baseStyle.fontWeight = typography.fontWeight.semibold;
        if (typography.fontFamily.semibold) {
          baseStyle.fontFamily = typography.fontFamily.semibold;
        }
        break;
      case 'body':
        baseStyle.fontSize = typography.fontSize.base;
        baseStyle.lineHeight = typography.lineHeight.base;
        baseStyle.fontWeight = typography.fontWeight.regular;
        if (typography.fontFamily.regular) {
          baseStyle.fontFamily = typography.fontFamily.regular;
        }
        break;
      case 'bodySmall':
        baseStyle.fontSize = typography.fontSize.sm;
        baseStyle.lineHeight = typography.lineHeight.sm;
        baseStyle.fontWeight = typography.fontWeight.regular;
        if (typography.fontFamily.regular) {
          baseStyle.fontFamily = typography.fontFamily.regular;
        }
        break;
      case 'caption':
        baseStyle.fontSize = typography.fontSize.xs;
        baseStyle.lineHeight = typography.lineHeight.xs;
        baseStyle.fontWeight = typography.fontWeight.regular;
        if (typography.fontFamily.regular) {
          baseStyle.fontFamily = typography.fontFamily.regular;
        }
        break;
      case 'label':
        baseStyle.fontSize = typography.fontSize.sm;
        baseStyle.lineHeight = typography.lineHeight.sm;
        baseStyle.fontWeight = typography.fontWeight.medium;
        if (typography.fontFamily.medium) {
          baseStyle.fontFamily = typography.fontFamily.medium;
        }
        break;
      case 'button':
        baseStyle.fontSize = typography.fontSize.base;
        baseStyle.lineHeight = typography.lineHeight.base;
        baseStyle.fontWeight = typography.fontWeight.semibold;
        if (typography.fontFamily.semibold) {
          baseStyle.fontFamily = typography.fontFamily.semibold;
        }
        break;
    }

    // Override weight if specified
    if (weight) {
      baseStyle.fontWeight = typography.fontWeight[weight];
      const fontFamilyKey = weight === 'regular' ? 'regular' : weight;
      if (typography.fontFamily[fontFamilyKey]) {
        baseStyle.fontFamily = typography.fontFamily[fontFamilyKey];
      }
    }

    // Color styles
    if (color) {
      switch (color) {
        case 'primary':
          baseStyle.color = colors.primary;
          break;
        case 'secondary':
          baseStyle.color = colors.textSecondary;
          break;
        case 'tertiary':
          baseStyle.color = colors.textTertiary;
          break;
        case 'error':
          baseStyle.color = colors.error;
          break;
        case 'success':
          baseStyle.color = colors.success;
          break;
        case 'warning':
          baseStyle.color = colors.warning;
          break;
      }
    } else {
      baseStyle.color = colors.text;
    }

    // Alignment
    if (align) {
      baseStyle.textAlign = align;
    }

    return baseStyle;
  };

  return (
    <RNText style={[getTextStyles(), style]} {...props}>
      {children}
    </RNText>
  );
}

