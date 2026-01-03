// Jest Configuration for Dilo App - Node environment
module.exports = {
    // Use Node environment (simpler, avoids React Native setup issues)
    testEnvironment: 'node',

    // Transform TypeScript
    transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-typescript'] }],
    },

    // Module name mapping for path aliases (@/)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Don't transform node_modules
    transformIgnorePatterns: [
        'node_modules/',
    ],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.[jt]s?(x)',
    ],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Clear mocks between tests
    clearMocks: true,

    // Force exit after tests complete
    forceExit: true,
};
