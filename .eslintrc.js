// ESLint Configuration for Dilo App
module.exports = {
    extends: ['expo', 'prettier'],
    plugins: ['prettier'],
    rules: {
        // Prettier integration
        'prettier/prettier': 'warn',

        // TypeScript
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility

        // React
        'react/prop-types': 'off', // Using TypeScript
        'react/react-in-jsx-scope': 'off', // Not needed in React 17+

        // General
        'no-console': 'off', // Allow console for debugging
        'prefer-const': 'warn',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    ignorePatterns: [
        'node_modules/',
        'dist/',
        'dist-check/',
        '.expo/',
        'android/',
        'ios/',
        '*.config.js',
    ],
};
