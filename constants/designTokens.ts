/**
 * Unified Design Tokens
 * Cross-platform design system ensuring visual consistency across iOS and Android
 */

import { Platform } from 'react-native';

// ============================================================================
// SPACING SYSTEM
// ============================================================================
// Based on 4px base unit for consistent spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================
export const typography = {
  // Font Families - Platform-agnostic
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },

  // Font Sizes - Consistent across platforms
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights - Optimized for readability
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 44,
    '5xl': 56,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// ============================================================================
// COLOR SYSTEM
// ============================================================================
export const colors = {
  light: {
    // Primary Colors
    primary: '#007AFF',
    primaryDark: '#0051D5',
    primaryLight: '#5AC8FA',
    
    // Semantic Colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Neutral Colors
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceElevated: '#FFFFFF',
    
    // Text Colors
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',
    textPlaceholder: '#C7C7CC',
    
    // Border Colors
    border: '#C6C6C8',
    borderLight: '#E5E5EA',
    divider: '#C6C6C8',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
    
    // Status Colors
    online: '#34C759',
    offline: '#8E8E93',
  },
  dark: {
    // Primary Colors
    primary: '#0A84FF',
    primaryDark: '#0051D5',
    primaryLight: '#64D2FF',
    
    // Semantic Colors
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    
    // Neutral Colors
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    
    // Text Colors
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#8E8E93',
    textPlaceholder: '#636366',
    
    // Border Colors
    border: '#38383A',
    borderLight: '#2C2C2E',
    divider: '#38383A',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Status Colors
    online: '#30D158',
    offline: '#636366',
  },
} as const;

// ============================================================================
// SHADOW SYSTEM
// ============================================================================
// Platform-specific shadows for consistent elevation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  base: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }),
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ============================================================================
// OPACITY
// ============================================================================
export const opacity = {
  disabled: 0.5,
  hover: 0.8,
  pressed: 0.6,
  overlay: 0.4,
  overlayLight: 0.1,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================
export const animation = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
} as const;

// ============================================================================
// BREAKPOINTS (for responsive design)
// ============================================================================
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;


