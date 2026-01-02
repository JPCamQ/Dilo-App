// Dilo App - Voice Button Component (FAB)
// Botón flotante principal para comandos de voz - "La Joya de la Corona"

import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface VoiceButtonProps {
    onPress: () => void;
    isListening?: boolean;
}

export default function VoiceButton({ onPress, isListening = false }: VoiceButtonProps) {
    const [pulseAnim] = useState(new Animated.Value(1));
    const [waveAnim] = useState(new Animated.Value(0));

    // Animación de pulso cuando está escuchando
    useEffect(() => {
        if (isListening) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Wave animation
            Animated.loop(
                Animated.timing(waveAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            waveAnim.setValue(0);
        }
    }, [isListening]);

    const handlePress = async () => {
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    const waveScale = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.5],
    });

    const waveOpacity = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    return (
        <View style={styles.container}>
            {/* Wave rings when listening */}
            {isListening && (
                <>
                    <Animated.View
                        style={[
                            styles.wave,
                            {
                                transform: [{ scale: waveScale }],
                                opacity: waveOpacity,
                            }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.wave,
                            styles.wave2,
                            {
                                transform: [{ scale: waveScale }],
                                opacity: waveOpacity,
                            }
                        ]}
                    />
                </>
            )}

            {/* Main Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={isListening ? [Colors.status.expense, '#991B1B'] : Colors.premium.actionGradient}
                        style={[
                            styles.button,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isListening ? (
                            <MicOff size={28} color={Colors.text.primary} />
                        ) : (
                            <Mic size={28} color={Colors.text.primary} />
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20, // Más cerca del tab bar
        alignSelf: 'center',
        alignItems: 'center',
    },
    wave: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.accent.primary,
        top: 4,
    },
    wave2: {
        width: 80,
        height: 80,
        borderRadius: 40,
        top: -4,
        left: -8,
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        // Premium Shadow
        shadowColor: Colors.premium.actionShadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: Colors.premium.borderGlass,
    },
    buttonListening: {
        shadowColor: Colors.status.expense,
    },
});
