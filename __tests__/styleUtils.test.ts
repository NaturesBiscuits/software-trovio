/**
 * Tests for styleUtils functions
 * Tests style combination and design token retrieval
 */

import { borderRadius, shadows, spacing } from '@/constants/designTokens';
import {
    combineStyles,
    getBorderRadius,
    getShadow,
    getSpacing,
    margin,
    padding,
} from '@/utils/styleUtils';

describe('styleUtils', () => {
  describe('combineStyles', () => {
    test('should combine multiple styles', () => {
      const style1 = { padding: 10 };
      const style2 = { marginTop: 5 };
      const result = combineStyles(style1, style2);
      
      expect(result).toHaveProperty('padding', 10);
      expect(result).toHaveProperty('marginTop', 5);
    });

    test('should override earlier styles with later ones', () => {
      const style1 = { padding: 10, color: 'red' };
      const style2 = { padding: 20 };
      const result = combineStyles(style1, style2);
      
      expect(result.padding).toBe(20);
      expect(result.color).toBe('red');
    });

    test('should filter out falsy values', () => {
      const style1 = { padding: 10 };
      const style2 = null;
      const style3 = undefined;
      const style4 = { marginTop: 5 };
      const result = combineStyles(style1, style2 as any, style3 as any, style4);
      
      expect(result).toHaveProperty('padding', 10);
      expect(result).toHaveProperty('marginTop', 5);
    });

    test('should handle false boolean value', () => {
      const style1 = { padding: 10 };
      const style2 = false;
      const style3 = { marginTop: 5 };
      const result = combineStyles(style1, style2 as any, style3);
      
      expect(Object.keys(result)).toHaveLength(2);
      expect(result).toHaveProperty('padding', 10);
      expect(result).toHaveProperty('marginTop', 5);
    });
  });

  describe('getSpacing', () => {
    test('should return correct spacing value', () => {
      const result = getSpacing('sm');
      expect(result).toBe(spacing.sm);
    });

    test('should handle multiple spacing keys', () => {
      expect(getSpacing('xs')).toBe(spacing.xs);
      expect(getSpacing('md')).toBe(spacing.md);
      expect(getSpacing('lg')).toBe(spacing.lg);
      expect(getSpacing('xl')).toBe(spacing.xl);
    });
  });

  describe('getBorderRadius', () => {
    test('should return correct border radius value', () => {
      const result = getBorderRadius('sm');
      expect(result).toBe(borderRadius.sm);
    });

    test('should handle different border radius values', () => {
      expect(getBorderRadius('none')).toBe(borderRadius.none);
      expect(getBorderRadius('md')).toBe(borderRadius.md);
      expect(getBorderRadius('lg')).toBe(borderRadius.lg);
      expect(getBorderRadius('full')).toBe(borderRadius.full);
    });
  });

  describe('getShadow', () => {
    test('should return shadow style object', () => {
      const result = getShadow('sm');
      expect(typeof result).toBe('object');
      expect(result).toEqual(shadows.sm);
    });

    test('should return empty object for non-existent shadow', () => {
      const result = getShadow('nonexistent' as any);
      expect(result).toEqual({});
    });
  });

  describe('padding', () => {
    test('should apply uniform padding with single argument', () => {
      const result = padding('md');
      expect(result).toHaveProperty('padding', spacing.md);
    });

    test('should apply padding individually', () => {
      const result = padding(undefined, 'md', 'lg');
      expect(result).toHaveProperty('paddingHorizontal', spacing.md);
      expect(result).toHaveProperty('paddingVertical', spacing.lg);
    });

    test('should apply uniform padding when all set', () => {
      const result = padding('md', 'lg', 'xl');
      expect(result).toHaveProperty('padding', spacing.md);
    });

    test('should handle no arguments', () => {
      const result = padding();
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('margin', () => {
    test('should apply uniform margin with single argument', () => {
      const result = margin('md');
      expect(result).toHaveProperty('margin', spacing.md);
    });

    test('should apply margin individually', () => {
      const result = margin(undefined, 'md', 'lg');
      expect(result).toHaveProperty('marginHorizontal', spacing.md);
      expect(result).toHaveProperty('marginVertical', spacing.lg);
    });

    test('should handle no arguments', () => {
      const result = margin();
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
