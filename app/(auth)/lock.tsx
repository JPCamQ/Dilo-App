// Dilo App - Lock Screen
// Pantalla de bloqueo con autenticación biométrica

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Eye, Fingerprint, Lock, Unlock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import AuthService from '@/services/auth';
import { useAppStore } from '@/stores/useAppStore';

export default function LockScreen() {
    const { setAuthenticated, setLocked } = useAppStore();

    const [pin, setPin] = useState('');
    const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'none'>('none');
    const [isLoading, setIsLoading] = useState(true);
    const [hasPinSetup, setHasPinSetup] = useState(false);

    useEffect(() => {
        checkAuthMethods();
    }, []);

    const checkAuthMethods = async () => {
        // Check biometric availability
        const biometric = await AuthService.checkBiometricAvailability();
        if (biometric.available) {
            setBiometricType(biometric.type === 'facial' ? 'facial' : 'fingerprint');

            // Auto-trigger biometric
            const biometricEnabled = await AuthService.isBiometricEnabled();
            if (biometricEnabled) {
                handleBiometricAuth();
            }
        }

        // Check if PIN is configured
        const hasPin = await AuthService.hasPinConfigured();
        setHasPinSetup(hasPin);
        setIsLoading(false);
    };

    const handleBiometricAuth = async () => {
        const result = await AuthService.authenticateBiometric();

        if (result.success) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            unlockApp();
        } else {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length < 4) {
            Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
            return;
        }

        if (!hasPinSetup) {
            // First time setup - save PIN
            const saved = await AuthService.savePin(pin);
            if (saved) {
                await AuthService.setBiometricEnabled(true);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('✅ PIN Configurado', 'Tu PIN ha sido guardado de forma segura');
                unlockApp();
            }
        } else {
            // Verify PIN
            const valid = await AuthService.verifyPin(pin);
            if (valid) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                unlockApp();
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'PIN incorrecto');
                setPin('');
            }
        }
    };

    const unlockApp = () => {
        setAuthenticated(true);
        setLocked(false);
        router.replace('/(tabs)');
    };

    const handlePinPress = (digit: string) => {
        if (pin.length < 6) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPin(prev => prev + digit);
        }
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPin(prev => prev.slice(0, -1));
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
                <View style={styles.iconCircle}>
                    <Lock size={40} color={Colors.accent.primary} />
                </View>
                <Text style={styles.appName}>Dilo App</Text>
                <Text style={styles.subtitle}>
                    {hasPinSetup ? 'Ingresa tu PIN' : 'Configura tu PIN'}
                </Text>
            </View>

            {/* PIN Dots */}
            <View style={styles.pinDots}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i < pin.length && styles.dotFilled,
                        ]}
                    />
                ))}
            </View>

            {/* Numpad */}
            <View style={styles.numpad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.numpadButton, key === '' && styles.numpadEmpty]}
                        onPress={() => {
                            if (key === 'del') handleDelete();
                            else if (key !== '') handlePinPress(key);
                        }}
                        disabled={key === ''}
                    >
                        {key === 'del' ? (
                            <Text style={styles.numpadDelete}>⌫</Text>
                        ) : (
                            <Text style={styles.numpadText}>{key}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Biometric Button */}
            {biometricType !== 'none' && hasPinSetup && (
                <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                    {biometricType === 'facial' ? (
                        <Eye size={28} color={Colors.accent.primary} />
                    ) : (
                        <Fingerprint size={28} color={Colors.accent.primary} />
                    )}
                    <Text style={styles.biometricText}>
                        {biometricType === 'facial' ? 'Face ID' : 'Touch ID'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Submit Button (for first-time setup) */}
            {pin.length >= 4 && (
                <TouchableOpacity style={styles.submitButton} onPress={handlePinSubmit}>
                    <Unlock size={20} color={Colors.text.primary} />
                    <Text style={styles.submitText}>
                        {hasPinSetup ? 'Desbloquear' : 'Guardar PIN'}
                    </Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        color: Colors.text.secondary,
        fontSize: 16,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.accent.primary,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.text.secondary,
    },
    pinDots: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 40,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.background.tertiary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    dotFilled: {
        backgroundColor: Colors.accent.primary,
        borderColor: Colors.accent.primary,
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 280,
        justifyContent: 'center',
        gap: 16,
    },
    numpadButton: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    numpadEmpty: {
        backgroundColor: 'transparent',
    },
    numpadText: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    numpadDelete: {
        fontSize: 24,
        color: Colors.text.secondary,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 32,
        padding: 16,
    },
    biometricText: {
        fontSize: 16,
        color: Colors.accent.primary,
        fontWeight: '500',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: Colors.accent.primary,
        borderRadius: 24,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
});
