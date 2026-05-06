/**
 * Style Utilities
 * Helper functions for consistent styling across the app
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { spacing, borderRadius, shadows, typography } from '@/constants/designTokens';

export type Style = ViewStyle | TextStyle | ImageStyle;

/**
 * Combine multiple styles into one
 */
export function combineStyles(...styles: (Style | undefined | null | false)[]): Style {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Get spacing value by key
 */
export function getSpacing(key: keyof typeof spacing): number {
  return spacing[key];
}

/**
 * Get border radius value by key
 */
export function getBorderRadius(key: keyof typeof borderRadius): number {
  return borderRadius[key];
}

/**
 * Get shadow styles by key
 */
export function getShadow(key: keyof typeof shadows): ViewStyle {
  return shadows[key] || {};
}

type SpacingStyleProperty = 'padding' | 'margin';
type SpacingAxisProperty = 'paddingHorizontal' | 'paddingVertical' | 'marginHorizontal' | 'marginVertical';

function createSpacingStyle(
  property: SpacingStyleProperty,
  all?: keyof typeof spacing,
  horizontal?: keyof typeof spacing,
  vertical?: keyof typeof spacing
): ViewStyle {
  const style: ViewStyle = {};

  if (all) {
    style[property] = spacing[all];
    return style;
  }

  const horizontalProperty = `${property}Horizontal` as SpacingAxisProperty;
  const verticalProperty = `${property}Vertical` as SpacingAxisProperty;

  if (horizontal) style[horizontalProperty] = spacing[horizontal];
  if (vertical) style[verticalProperty] = spacing[vertical];

  return style;
}

/**
 * Create consistent padding style
 */
export function padding(
  all?: keyof typeof spacing,
  horizontal?: keyof typeof spacing,
  vertical?: keyof typeof spacing
): ViewStyle {
  return createSpacingStyle('padding', all, horizontal, vertical);
}

/**
 * Create consistent margin style
 */
export function margin(
  all?: keyof typeof spacing,
  horizontal?: keyof typeof spacing,
  vertical?: keyof typeof spacing
): ViewStyle {
  return createSpacingStyle('margin', all, horizontal, vertical);
}

/**
 * Create flexbox utilities
 */
export const flex = {
  row: { flexDirection: 'row' as const },
  column: { flexDirection: 'column' as const },
  center: { alignItems: 'center' as const, justifyContent: 'center' as const },
  centerHorizontal: { alignItems: 'center' as const },
  centerVertical: { justifyContent: 'center' as const },
  spaceBetween: { justifyContent: 'space-between' as const },
  spaceAround: { justifyContent: 'space-around' as const },
  spaceEvenly: { justifyContent: 'space-evenly' as const },
  flex1: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  flexShrink: { flexShrink: 1 },
  wrap: { flexWrap: 'wrap' as const },
} as const;

/**
 * Create typography style
 */
export function createTypographyStyle(
  size: keyof typeof typography.fontSize,
  weight: keyof typeof typography.fontWeight = 'regular'
): TextStyle {
  return {
    fontSize: typography.fontSize[size],
    lineHeight: typography.lineHeight[size],
    fontWeight: typography.fontWeight[weight],
    fontFamily: typography.fontFamily[weight === 'regular' ? 'regular' : weight],
  };
}


