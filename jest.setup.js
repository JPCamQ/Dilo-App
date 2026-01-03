// Jest Setup File
// Add any global test setup here

// Mock expo-constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            DEEPSEEK_API_KEY: 'test-api-key',
            GOOGLE_WEB_CLIENT_ID: 'test-client-id',
        },
    },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
    isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
    authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
    supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])), // FINGERPRINT
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
    },
}));

// Silence console.log in tests (optional - comment out for debugging)
// global.console = {
//     ...console,
//     log: jest.fn(),
//     warn: jest.fn(),
// };
