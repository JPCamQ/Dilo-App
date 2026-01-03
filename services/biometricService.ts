// Dilo App - Biometric Authentication Service
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// ============================================
// Types
// ============================================

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricStatus {
    isAvailable: boolean;
    biometricType: BiometricType;
    isEnrolled: boolean;
}

// Storage key for biometric preference
const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

// ============================================
// Check Device Biometric Capabilities
// ============================================

export async function checkBiometricAvailability(): Promise<BiometricStatus> {
    try {
        // Check if device has biometric hardware
        const hasHardware = await LocalAuthentication.hasHardwareAsync();

        if (!hasHardware) {
            return {
                isAvailable: false,
                biometricType: 'none',
                isEnrolled: false,
            };
        }

        // Check if biometrics are enrolled (user has set up fingerprint/face)
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!isEnrolled) {
            return {
                isAvailable: false,
                biometricType: 'none',
                isEnrolled: false,
            };
        }

        // Get supported biometric types
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let biometricType: BiometricType = 'none';

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            biometricType = 'facial';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            biometricType = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            biometricType = 'iris';
        }

        return {
            isAvailable: biometricType !== 'none',
            biometricType,
            isEnrolled: true,
        };
    } catch (error) {
        console.error('❌ Error checking biometric availability:', error);
        return {
            isAvailable: false,
            biometricType: 'none',
            isEnrolled: false,
        };
    }
}

// ============================================
// Authenticate with Biometrics
// ============================================

export interface AuthResult {
    success: boolean;
    error?: string;
}

export async function authenticateWithBiometrics(
    promptMessage: string = 'Desbloquear Dilo App'
): Promise<AuthResult> {
    try {
        const status = await checkBiometricAvailability();

        if (!status.isAvailable) {
            return {
                success: false,
                error: 'Biometría no disponible en este dispositivo',
            };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Usar contraseña',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false, // Allow PIN/password as fallback
        });

        if (result.success) {
            console.log('✅ Biometric authentication successful');
            return { success: true };
        } else {
            console.log('❌ Biometric authentication failed:', result.error);
            return {
                success: false,
                error: getBiometricErrorMessage(result.error),
            };
        }
    } catch (error: any) {
        console.error('❌ Biometric auth error:', error);
        return {
            success: false,
            error: 'Error de autenticación biométrica',
        };
    }
}

// ============================================
// Biometric Preference Storage
// ============================================

export async function isBiometricEnabled(): Promise<boolean> {
    try {
        const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return value === 'true';
    } catch (error) {
        console.warn('⚠️ Failed to read biometric preference:', error);
        return false;
    }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
        if (enabled) {
            // Verify biometrics work before enabling
            const status = await checkBiometricAvailability();
            if (!status.isAvailable) {
                throw new Error('Biometría no disponible');
            }
        }

        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
        console.log(`🔐 Biometric ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('❌ Failed to save biometric preference:', error);
        throw error;
    }
}

// ============================================
// Helper Functions
// ============================================

function getBiometricErrorMessage(error: string | undefined): string {
    switch (error) {
        case 'user_cancel':
            return 'Autenticación cancelada';
        case 'lockout':
            return 'Demasiados intentos. Intenta más tarde.';
        case 'lockout_permanent':
            return 'Biometría bloqueada. Usa tu contraseña del dispositivo.';
        case 'not_enrolled':
            return 'No hay biometría configurada en el dispositivo';
        case 'authentication_failed':
            return 'Autenticación fallida';
        default:
            return 'Error de autenticación';
    }
}

export function getBiometricLabel(type: BiometricType): string {
    switch (type) {
        case 'fingerprint':
            return 'Huella dactilar';
        case 'facial':
            return 'Face ID';
        case 'iris':
            return 'Iris';
        default:
            return 'Biometría';
    }
}

export function getBiometricIcon(type: BiometricType): string {
    switch (type) {
        case 'fingerprint':
            return 'fingerprint';
        case 'facial':
            return 'scan-face';
        case 'iris':
            return 'eye';
        default:
            return 'lock';
    }
}

// ============================================
// Export Service Object
// ============================================

export const BiometricService = {
    checkAvailability: checkBiometricAvailability,
    authenticate: authenticateWithBiometrics,
    isEnabled: isBiometricEnabled,
    setEnabled: setBiometricEnabled,
    getLabel: getBiometricLabel,
    getIcon: getBiometricIcon,
};

export default BiometricService;
