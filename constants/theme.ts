/**
 * Theme System
 * This file maintains backward compatibility while using the new design tokens
 * 
 * For new code, prefer using the design tokens directly via useDesignSystem hook
 * @see constants/designTokens.ts
 * @see hooks/use-design-system.ts
 */

import { colors as designColors } from './designTokens';

// Backward compatibility exports
export const Colors = {
  light: {
    text: designColors.light.text,
    background: designColors.light.background,
    tint: designColors.light.primary,
    icon: designColors.light.textTertiary,
    tabIconDefault: designColors.light.textTertiary,
    tabIconSelected: designColors.light.primary,
  },
  dark: {
    text: designColors.dark.text,
    background: designColors.dark.background,
    tint: designColors.dark.primary,
    icon: designColors.dark.textTertiary,
    tabIconDefault: designColors.dark.textTertiary,
    tabIconSelected: designColors.dark.primary,
  },
};

// Re-export design tokens for convenience
export { colors, typography, spacing, shadows, borderRadius, opacity, zIndex, animation } from './designTokens';
