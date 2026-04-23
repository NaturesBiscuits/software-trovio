// Jest setup file - must be CommonJS for jest to work properly
Object.defineProperty(require, 'cache', {
  value: {},
  writable: true,
});

// Mock React Native BEFORE anything else tries to load it
jest.mock('react-native', () => ({
  Platform: {
    select: (obj) => obj.default || obj.web || obj.android || obj.ios,
    OS: 'web',
  },
  useColorScheme: jest.fn(() => 'light'),
  TouchableOpacity: 'TouchableOpacity',
  Text: 'Text',
  View: 'View',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Animated: {
    Value: class {},
  },
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

require('@testing-library/jest-dom');

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('ViewPropTypes') ||
       args[0].includes('RCTEvent') ||
       args[0].includes('TestInstance'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
