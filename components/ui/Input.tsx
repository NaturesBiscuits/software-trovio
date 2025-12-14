/**
 * Input Component
 * Cross-platform text input with consistent styling
 */

import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useDesignSystem } from '@/hooks/use-design-system';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  style,
  ...props
}: InputProps) {
  const { colors, typography, spacing, borderRadius, opacity } = useDesignSystem();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            borderRadius: borderRadius.base,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
          },
          leftIcon && { paddingLeft: spacing.sm },
          rightIcon && { paddingRight: spacing.sm },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.base,
              fontWeight: typography.fontWeight.regular,
              ...(typography.fontFamily.regular && { fontFamily: typography.fontFamily.regular }),
              flex: 1,
            },
            inputStyle,
            style,
          ]}
          placeholderTextColor={colors.textPlaceholder}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? colors.error : colors.textTertiary,
              marginTop: spacing.xs,
            }]
          }
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    padding: 0,
    margin: 0,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
  },
});

