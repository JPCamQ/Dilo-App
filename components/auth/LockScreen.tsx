// Dilo App - Lock Screen with Biometric Authentication
import { Colors } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint, Lock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function LockScreen() {
    const { biometricEnabled, setLocked, isLocked } = useAppStore();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<string>('Biometría');

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    useEffect(() => {
        if (isLocked && biometricEnabled && biometricAvailable) {
            authenticate();
        }
    }, [isLocked, biometricEnabled, biometricAvailable]);

    const checkBiometricAvailability = async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(compatible && enrolled);

            if (compatible && enrolled) {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBiometricType('Face ID');
                } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                    setBiometricType('Huella digital');
                }
            }
        } catch (error) {
            console.error('Error checking biometric:', error);
        }
    };

    const authenticate = async () => {
        if (isAuthenticating) return;

        setIsAuthenticating(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Desbloquear Dilo App',
                fallbackLabel: 'Usar PIN',
                disableDeviceFallback: false,
            });

            if (result.success) {
                setLocked(false);
            } else if (result.error === 'user_cancel') {
                // User cancelled, do nothing
            } else {
                Alert.alert('Error', 'No se pudo verificar tu identidad');
            }
        } catch (error) {
            console.error('Authentication error:', error);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleSkip = () => {
        // Allow skip only if biometric is not enabled
        if (!biometricEnabled) {
            setLocked(false);
        }
    };

    if (!isLocked) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('@/assets/images/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Dilo</Text>
                <Text style={styles.subtitle}>Gestión Financiera</Text>

                <View style={styles.lockIconContainer}>
                    <Lock size={48} color={Colors.accent.emerald} />
                </View>

                <Text style={styles.message}>
                    {biometricEnabled
                        ? `Usa ${biometricType} para desbloquear`
                        : 'La app está bloqueada'}
                </Text>

                <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={authenticate}
                    disabled={isAuthenticating}
                >
                    <Fingerprint size={24} color="#FFF" />
                    <Text style={styles.unlockText}>
                        {isAuthenticating ? 'Verificando...' : 'Desbloquear'}
                    </Text>
                </TouchableOpacity>

                {!biometricEnabled && (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                    >
                        <Text style={styles.skipText}>Continuar sin biometría</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
        padding: 40,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.muted,
        marginBottom: 40,
    },
    lockIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: Colors.accent.emerald,
    },
    message: {
        fontSize: 16,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    unlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.accent.emerald,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        marginBottom: 16,
    },
    unlockText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    skipButton: {
        padding: 12,
    },
    skipText: {
        fontSize: 14,
        color: Colors.text.muted,
    },
});
