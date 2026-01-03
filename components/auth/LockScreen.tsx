// Dilo App - Lock Screen with Biometric Authentication
import { Colors } from '@/constants/Colors';
import { BiometricService, BiometricType } from '@/services/biometricService';
import { useAppStore } from '@/stores/useAppStore';
import { Fingerprint, Lock, ScanFace } from 'lucide-react-native';
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
    const [biometricType, setBiometricType] = useState<BiometricType>('none');
    const [biometricLabel, setBiometricLabel] = useState('Biometría');

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    useEffect(() => {
        // Auto-authenticate when screen mounts if biometric is enabled
        if (isLocked && biometricEnabled && biometricAvailable) {
            // Small delay for better UX
            const timer = setTimeout(() => authenticate(), 500);
            return () => clearTimeout(timer);
        }
    }, [isLocked, biometricEnabled, biometricAvailable]);

    const checkBiometricAvailability = async () => {
        const status = await BiometricService.checkAvailability();
        setBiometricAvailable(status.isAvailable);
        setBiometricType(status.biometricType);
        setBiometricLabel(BiometricService.getLabel(status.biometricType));
    };

    const authenticate = async () => {
        if (isAuthenticating) return;

        setIsAuthenticating(true);
        try {
            const result = await BiometricService.authenticate('Desbloquear Dilo App');

            if (result.success) {
                setLocked(false);
            } else if (result.error && result.error !== 'Autenticación cancelada') {
                Alert.alert('Error', result.error);
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

    // Render the appropriate biometric icon
    const renderBiometricIcon = () => {
        const iconProps = { size: 24, color: '#FFF' };

        switch (biometricType) {
            case 'facial':
                return <ScanFace {...iconProps} />;
            case 'fingerprint':
            default:
                return <Fingerprint {...iconProps} />;
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
                <Text style={styles.subtitle}>Gestión Financiera por Voz</Text>

                <View style={styles.lockIconContainer}>
                    <Lock size={48} color={Colors.accent.emerald} />
                </View>

                <Text style={styles.message}>
                    {biometricEnabled && biometricAvailable
                        ? `Usa ${biometricLabel} para desbloquear`
                        : 'La app está bloqueada'}
                </Text>

                <TouchableOpacity
                    style={[
                        styles.unlockButton,
                        isAuthenticating && styles.unlockButtonDisabled
                    ]}
                    onPress={authenticate}
                    disabled={isAuthenticating}
                    activeOpacity={0.8}
                >
                    {renderBiometricIcon()}
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

                {biometricAvailable && !biometricEnabled && (
                    <Text style={styles.hint}>
                        💡 Activa la biometría en Ajustes para mayor seguridad
                    </Text>
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
    unlockButtonDisabled: {
        opacity: 0.6,
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
    hint: {
        fontSize: 13,
        color: Colors.text.muted,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
});
