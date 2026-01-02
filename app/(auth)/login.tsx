// Dilo App - Login Screen
// Native Google Sign-In with premium design

import { Colors } from '@/constants/Colors';
import { configureGoogleSignIn, isGoogleSignInAvailable, signIn } from '@/services/googleAuthService';
import { useAppStore } from '@/stores/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mic, Shield, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { setGoogleUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        configureGoogleSignIn();
        setIsAvailable(isGoogleSignInAvailable());
    }, []);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);

        const result = await signIn();

        if (result.success && result.user) {
            // Save to store
            setGoogleUser({
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    photo: result.user.photo,
                    familyName: null,
                    givenName: null,
                }
            } as any);

            // Navigate to main app
            router.replace('/(tabs)');
        } else {
            Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
        }

        setIsLoading(false);
    };

    const handleSkip = () => {
        // Allow using app without login
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Background gradient */}
            <LinearGradient
                colors={[Colors.background.primary, '#0A1628', Colors.background.primary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            <SafeAreaView style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[Colors.accent.primary, Colors.accent.emerald]}
                            style={styles.logoGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Mic size={48} color="#FFF" />
                        </LinearGradient>
                        <Sparkles size={20} color="#FFD700" style={styles.sparkle} />
                    </View>
                    <Text style={styles.appName}>Dilo</Text>
                    <Text style={styles.tagline}>Tu asistente financiero con voz</Text>
                </View>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Mic size={20} color={Colors.accent.primary} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Registro por voz</Text>
                            <Text style={styles.featureDesc}>Di "Gasté 20 en café" y listo</Text>
                        </View>
                    </View>

                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Shield size={20} color={Colors.accent.primary} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Respaldo seguro</Text>
                            <Text style={styles.featureDesc}>Tus datos en Google Drive</Text>
                        </View>
                    </View>
                </View>

                {/* Actions Section */}
                <View style={styles.actionsSection}>
                    {!isAvailable && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                ⚠️ Google Sign-In requiere el APK de desarrollo
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.googleButton, !isAvailable && styles.googleButtonDisabled]}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading || !isAvailable}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isAvailable ? ['#FFF', '#F8F9FA'] : ['#666', '#555']}
                            style={styles.googleButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={Colors.accent.primary} />
                            ) : (
                                <>
                                    <Image
                                        source={{ uri: 'https://www.google.com/favicon.ico' }}
                                        style={styles.googleIcon}
                                    />
                                    <Text style={[styles.googleButtonText, !isAvailable && styles.googleButtonTextDisabled]}>
                                        Continuar con Google
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipButtonText}>Usar sin cuenta</Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        Al continuar, aceptas que tus datos se respaldarán en tu Google Drive personal
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 60,
        paddingBottom: 40,
    },

    // Decorative elements
    circle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.accent.primary,
        opacity: 0.05,
    },
    circle2: {
        position: 'absolute',
        bottom: -50,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: Colors.accent.emerald,
        opacity: 0.05,
    },

    // Logo Section
    logoSection: {
        alignItems: 'center',
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.accent.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    sparkle: {
        position: 'absolute',
        top: -5,
        right: -5,
    },
    appName: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -2,
        fontFamily: Platform.OS === 'android' ? 'sans-serif-condensed' : undefined,
    },
    tagline: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginTop: 8,
    },

    // Features Section
    featuresSection: {
        gap: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.accent.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: Colors.text.muted,
    },

    // Actions Section
    actionsSection: {
        gap: 16,
    },
    warningBox: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    warningText: {
        fontSize: 13,
        color: Colors.status.warning,
        textAlign: 'center',
    },
    googleButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    googleButtonDisabled: {
        opacity: 0.6,
    },
    googleButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 12,
    },
    googleIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    googleButtonTextDisabled: {
        color: '#999',
    },
    skipButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 15,
        color: Colors.text.muted,
        fontWeight: '500',
    },
    disclaimer: {
        fontSize: 12,
        color: Colors.text.muted,
        textAlign: 'center',
        lineHeight: 18,
        opacity: 0.7,
    },
});
