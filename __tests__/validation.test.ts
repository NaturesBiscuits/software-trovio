/**
 * Tests for validation utilities
 * Tests email validation, password validation, etc.
 */

describe('Email validation', () => {
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  test('should validate correct email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    expect(isValidEmail('john+tag@gmail.com')).toBe(true);
  });

  test('should reject invalid email formats', () => {
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user domain@example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('should handle edge cases', () => {
    expect(isValidEmail(' user@example.com')).toBe(false);
    expect(isValidEmail('user@example.com ')).toBe(false);
  });
});

describe('Password validation', () => {
  const isValidPassword = (password: string): boolean => {
    // Must be at least 6 characters
    return password.length >= 6;
  };

  const isStrongPassword = (password: string): boolean => {
    // Must contain uppercase, lowercase, number, and special character
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    return password.length >= 8 && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  };

  test('should validate minimum password length', () => {
    expect(isValidPassword('abc123')).toBe(true);
    expect(isValidPassword('abcde')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });

  test('should validate strong passwords', () => {
    expect(isStrongPassword('Str0ng!Pass')).toBe(true);
    expect(isStrongPassword('WeakPassword123')).toBe(false); // no special char
    expect(isStrongPassword('weak123!@')).toBe(false); // no uppercase
    expect(isStrongPassword('WEAK123!@')).toBe(false); // no lowercase
  });
});

describe('URL validation', () => {
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  test('should validate correct URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://sub.example.com/path')).toBe(true);
    expect(isValidUrl('https://example.com:8080')).toBe(true);
  });

  test('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('http://')).toBe(false);
  });
});

describe('String utilities', () => {
  const truncate = (text: string, length: number): string => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const toTitleCase = (text: string): string => {
    return text.split(' ').map(word => capitalize(word)).join(' ');
  };

  test('should truncate long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  test('should capitalize strings', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('HELLO');
    expect(capitalize('')).toBe('');
  });

  test('should convert to title case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
    expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
  });
});
