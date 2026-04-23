/**
 * Tests for cn utility function
 * Tests class name merging and Tailwind class deduplication
 */

import { cn } from '@/utils/cn';

describe('cn utility', () => {
  test('should merge single class', () => {
    const result = cn('px-2');
    expect(result).toBe('px-2');
  });

  test('should merge multiple classes', () => {
    const result = cn('px-2', 'py-2', 'bg-blue-500');
    expect(result).toContain('px-2');
    expect(result).toContain('py-2');
    expect(result).toContain('bg-blue-500');
  });

  test('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('px-2', isActive && 'bg-blue-500', !isActive && 'bg-gray-500');
    expect(result).toContain('px-2');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-gray-500');
  });

  test('should deduplicate conflicting Tailwind classes', () => {
    const result = cn('bg-blue-500', 'bg-red-500');
    expect(result).toContain('bg-red-500');
    // bg-blue-500 should be overridden by bg-red-500
  });

  test('should handle empty inputs', () => {
    const result = cn('', 'px-2', '');
    expect(result).toBe('px-2');
  });

  test('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-2');
    expect(result).toContain('px-2');
    expect(result).toContain('py-2');
  });

  test('should handle object classes', () => {
    const result = cn({
      'px-2': true,
      'py-2': false,
    }, 'bg-blue-500');
    expect(result).toContain('px-2');
    expect(result).not.toContain('py-2');
    expect(result).toContain('bg-blue-500');
  });
});
