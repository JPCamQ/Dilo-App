// Dilo App - Voice Listening Modal (Expo Go Compatible)
// Shows manual text input in Expo Go, real voice recognition in APK

import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Check, Mic, MicOff, RotateCcw, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Dynamic import for native module - may not exist in Expo Go
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
let isNativeAvailable = false;

try {
    const speechModule = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
    isNativeAvailable = ExpoSpeechRecognitionModule != null;
} catch (e) {
    console.log('Speech recognition not available (Expo Go mode)');
}

interface VoiceListeningModalProps {
    visible: boolean;
    onResult: (text: string) => void;
    onCancel: () => void;
}

// Stub hook for when native module is not available
const useStubEvent = (event: string, handler: any) => {
    // Do nothing - just a stub
};

export default function VoiceListeningModal({
    visible,
    onResult,
    onCancel,
}: VoiceListeningModalProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [manualInput, setManualInput] = useState('');
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;
    const finalTextRef = useRef('');

    // Use real hook or stub based on availability
    const useEventHook = isNativeAvailable ? useSpeechRecognitionEvent : useStubEvent;

    // Speech Recognition Event Handlers - only work with native module
    useEventHook('start', () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
        setError(null);
    });

    useEventHook('end', () => {
        console.log('🔇 Speech recognition ended');
        setIsListening(false);
        if (partialTranscript && !transcript) {
            setTranscript(partialTranscript);
            finalTextRef.current = partialTranscript;
        }
    });

    useEventHook('result', (event: any) => {
        if (event?.results && event.results.length > 0) {
            const result = event.results[0];
            if (result) {
                const text = result.transcript || '';
                if (event.isFinal) {
                    setTranscript(text);
                    finalTextRef.current = text;
                    setPartialTranscript('');
                } else {
                    setPartialTranscript(text);
                }
            }
        }
    });

    useEventHook('error', (event: any) => {
        console.error('❌ Speech error:', event?.error, event?.message);
        setError(`Error: ${event?.message || event?.error || 'Unknown'}`);
        setIsListening(false);
    });

    // Animation for listening state
    useEffect(() => {
        if (isListening) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(waveAnim, { toValue: 0, duration: 0, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
            waveAnim.setValue(0);
        }
    }, [isListening]);

    useEffect(() => {
        if (visible) {
            setTranscript('');
            setPartialTranscript('');
            setError(null);
            setManualInput('');
            finalTextRef.current = '';
            if (isNativeAvailable) {
                startListening();
            }
        } else {
            stopListening();
        }
    }, [visible]);

    const startListening = async () => {
        if (!ExpoSpeechRecognitionModule) {
            setError('Modo Expo Go - usa entrada manual');
            return;
        }

        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                setError('Permiso de micrófono denegado');
                return;
            }

            ExpoSpeechRecognitionModule.start({
                lang: 'es-VE',
                interimResults: true,
                maxAlternatives: 1,
                continuous: true,
                requiresOnDeviceRecognition: false,
                addsPunctuation: false,
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err: any) {
            console.error('Error starting speech recognition:', err);
            setError('Error al iniciar: ' + (err.message || 'Desconocido'));
        }
    };

    const stopListening = () => {
        if (ExpoSpeechRecognitionModule) {
            try {
                ExpoSpeechRecognitionModule.stop();
            } catch (err) {
                // Ignore
            }
        }
        setIsListening(false);
    };

    const handleRetry = () => {
        setTranscript('');
        setPartialTranscript('');
        setError(null);
        setManualInput('');
        finalTextRef.current = '';
        if (isNativeAvailable) {
            startListening();
        }
    };

    const handleConfirm = () => {
        const textToUse = isNativeAvailable
            ? (transcript || partialTranscript || finalTextRef.current)
            : manualInput;
        if (textToUse.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            stopListening();
            onResult(textToUse.trim());
        }
    };

    const displayText = transcript || partialTranscript;
    const canConfirm = isNativeAvailable
        ? !!(transcript || partialTranscript || finalTextRef.current)
        : manualInput.trim().length > 0;

    const waveScale = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
    const waveOpacity = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                        <X size={24} color={Colors.text.secondary} />
                    </TouchableOpacity>

                    {/* Expo Go Mode - Manual Text Input */}
                    {!isNativeAvailable ? (
                        <>
                            <View style={styles.expoGoHeader}>
                                <Text style={styles.expoGoTitle}>📝 Modo Expo Go</Text>
                                <Text style={styles.expoGoHint}>Escribe tu comando manualmente</Text>
                            </View>
                            <TextInput
                                style={styles.manualInput}
                                value={manualInput}
                                onChangeText={setManualInput}
                                placeholder='Ej: "Gasté 20 dólares en comida"'
                                placeholderTextColor={Colors.text.muted}
                                multiline
                                autoFocus
                            />
                        </>
                    ) : (
                        <>
                            {/* Native Voice Mode */}
                            <View style={styles.micContainer}>
                                {isListening && (
                                    <>
                                        <Animated.View style={[styles.wave, { transform: [{ scale: waveScale }], opacity: waveOpacity }]} />
                                        <Animated.View style={[styles.wave, styles.wave2, { transform: [{ scale: waveScale }], opacity: waveOpacity }]} />
                                    </>
                                )}
                                <Animated.View style={[styles.micCircle, isListening && styles.micCircleActive, { transform: [{ scale: pulseAnim }] }]}>
                                    {isListening ? <Mic size={40} color="#FFF" /> : <MicOff size={40} color={Colors.text.secondary} />}
                                </Animated.View>
                            </View>

                            <Text style={styles.statusText}>
                                {isListening ? 'Escuchando...' : error ? 'Error' : displayText ? 'Listo' : 'Detenido'}
                            </Text>

                            <View style={styles.transcriptBox}>
                                {displayText ? (
                                    <Text style={styles.transcriptText}>"{displayText}"</Text>
                                ) : error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : (
                                    <Text style={styles.placeholderText}>Di algo como:{'\n'}"Gasté 20 dólares en comida"</Text>
                                )}
                            </View>
                        </>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                            <RotateCcw size={22} color={Colors.text.secondary} />
                            <Text style={styles.retryText}>{isNativeAvailable ? 'Reintentar' : 'Limpiar'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
                            onPress={handleConfirm}
                            disabled={!canConfirm}
                        >
                            <Check size={22} color="#FFF" />
                            <Text style={styles.confirmText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        zIndex: 10,
    },
    // Expo Go mode
    expoGoHeader: { marginTop: 20, marginBottom: 16, alignItems: 'center' },
    expoGoTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
    expoGoHint: { fontSize: 14, color: Colors.text.muted, marginTop: 4 },
    manualInput: {
        width: '100%',
        minHeight: 100,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: Colors.text.primary,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    // Voice mode
    micContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    wave: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.accent.emerald,
    },
    wave2: { width: 120, height: 120, borderRadius: 60 },
    micCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.border.default,
    },
    micCircleActive: {
        backgroundColor: Colors.accent.emerald,
        borderColor: Colors.accent.emerald,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 20,
    },
    transcriptBox: {
        width: '100%',
        minHeight: 100,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    transcriptText: {
        fontSize: 18,
        color: Colors.text.primary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    placeholderText: {
        fontSize: 15,
        color: Colors.text.muted,
        textAlign: 'center',
        lineHeight: 22,
    },
    errorText: {
        fontSize: 15,
        color: Colors.status.expense,
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.background.tertiary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    retryText: { fontSize: 15, fontWeight: '600', color: Colors.text.secondary },
    confirmButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.accent.emerald,
    },
    confirmButtonDisabled: {
        backgroundColor: Colors.background.tertiary,
        opacity: 0.5,
    },
    confirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
