/**
 * Design System Hook
 * Provides access to design tokens with theme support
 */

import { useColorScheme } from './use-color-scheme';
import { colors, typography, spacing, shadows, borderRadius, opacity, zIndex, animation } from '@/constants/designTokens';

export function useDesignSystem() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = colors[colorScheme];

  return {
    colors: themeColors,
    typography,
    spacing,
    shadows,
    borderRadius,
    opacity,
    zIndex,
    animation,
    colorScheme,
  };
}

/**
 * Hook to get a specific color from the theme
 */
export function useThemeColor(colorKey: keyof typeof colors.light) {
  const colorScheme = useColorScheme() ?? 'light';
  return colors[colorScheme][colorKey];
}


