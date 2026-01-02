// Dilo App - Authentication Service
// Maneja autenticación biométrica (Face ID / Touch ID) y PIN

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'dilo_app_pin';
const BIOMETRIC_ENABLED_KEY = 'dilo_app_biometric_enabled';

interface BiometricResult {
    available: boolean;
    type: 'fingerprint' | 'facial' | 'iris' | 'none';
    enrolled: boolean;
}

/**
 * Verifica la disponibilidad de autenticación biométrica
 */
export async function checkBiometricAvailability(): Promise<BiometricResult> {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let type: 'fingerprint' | 'facial' | 'iris' | 'none' = 'none';

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = 'facial';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            type = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            type = 'iris';
        }

        return {
            available: hasHardware && isEnrolled,
            type,
            enrolled: isEnrolled,
        };
    } catch (error) {
        console.error('Error checking biometric availability:', error);
        return {
            available: false,
            type: 'none',
            enrolled: false,
        };
    }
}

/**
 * Autentica al usuario con biometría
 */
export async function authenticateBiometric(
    reason: string = 'Autentícate para acceder a Dilo App'
): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason,
            cancelLabel: 'Cancelar',
            fallbackLabel: 'Usar PIN',
            disableDeviceFallback: false,
        });

        return {
            success: result.success,
            error: !result.success ? (result as any).error : undefined,
        };
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return {
            success: false,
            error: 'Error de autenticación',
        };
    }
}

/**
 * Guarda el PIN del usuario de forma segura
 */
export async function savePin(pin: string): Promise<boolean> {
    try {
        await SecureStore.setItemAsync(PIN_KEY, pin);
        return true;
    } catch (error) {
        console.error('Error saving PIN:', error);
        return false;
    }
}

/**
 * Verifica el PIN del usuario
 */
export async function verifyPin(pin: string): Promise<boolean> {
    try {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        return storedPin === pin;
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return false;
    }
}

/**
 * Verifica si hay un PIN configurado
 */
export async function hasPinConfigured(): Promise<boolean> {
    try {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        return storedPin !== null && storedPin.length > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Guarda preferencia de biometría
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.error('Error saving biometric preference:', error);
    }
}

/**
 * Verifica si la biometría está habilitada
 */
export async function isBiometricEnabled(): Promise<boolean> {
    try {
        const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return value === 'true';
    } catch (error) {
        return false;
    }
}

/**
 * Elimina el PIN (logout)
 */
export async function clearPin(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(PIN_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
        console.error('Error clearing PIN:', error);
    }
}

export const AuthService = {
    checkBiometricAvailability,
    authenticateBiometric,
    savePin,
    verifyPin,
    hasPinConfigured,
    setBiometricEnabled,
    isBiometricEnabled,
    clearPin,
};

export default AuthService;
