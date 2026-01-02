// Dilo App - Environment Configuration
// Centralized access to environment variables with validation

import Constants from 'expo-constants';

interface EnvConfig {
    DEEPSEEK_API_KEY: string;
    GOOGLE_WEB_CLIENT_ID: string;
}

// Access environment variables through Expo Constants or process.env
const getEnvVar = (key: string): string => {
    // First try EXPO_PUBLIC_ prefix in process.env (works with .env files)
    const publicKey = `EXPO_PUBLIC_${key}`;
    if (process.env[publicKey]) {
        return process.env[publicKey] as string;
    }
    // Then try expo extra config
    if (Constants.expoConfig?.extra?.[key]) {
        return Constants.expoConfig.extra[key];
    }
    return '';
};

export const ENV: EnvConfig = {
    DEEPSEEK_API_KEY: getEnvVar('DEEPSEEK_API_KEY'),
    GOOGLE_WEB_CLIENT_ID: getEnvVar('GOOGLE_WEB_CLIENT_ID'),
};

// Debug log for development
console.log('[ENV] GOOGLE_WEB_CLIENT_ID loaded:', ENV.GOOGLE_WEB_CLIENT_ID ? 'YES' : 'NO');

// Check if optional services are configured
export const isDeepSeekConfigured = (): boolean => !!ENV.DEEPSEEK_API_KEY;
export const isGoogleConfigured = (): boolean => !!ENV.GOOGLE_WEB_CLIENT_ID;

export default ENV;
