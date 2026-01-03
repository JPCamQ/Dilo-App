// Jest Configuration for Dilo App
module.exports = {
    preset: 'jest-expo',
    testEnvironment: 'node',

    // Transform TypeScript files
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },

    // Module name mapping for path aliases (@/)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Files to ignore during transformation
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'services/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output
    verbose: true,
};
