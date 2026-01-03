// Jest Configuration for Dilo App
// Using ts-jest for TypeScript without React Native runtime issues

/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // Root directory
    rootDir: './',

    // Module name mapping for path aliases (@/)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Transform TypeScript
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                module: 'commonjs',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        }],
    },

    // Skip node_modules
    transformIgnorePatterns: [
        '/node_modules/',
    ],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.ts',
    ],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Clear mocks between tests
    clearMocks: true,

    // Force exit after tests
    forceExit: true,

    // Setup file for mocks
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
