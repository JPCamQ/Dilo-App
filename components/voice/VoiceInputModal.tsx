// Dilo App - Voice Input Modal (Premium Design)
import { Colors } from '@/constants/Colors';
import { ArrowUp, DollarSign, Mic, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface VoiceInputModalProps {
    visible: boolean;
    onSubmit: (text: string) => void;
    onCancel: () => void;
}

export default function VoiceInputModal({ visible, onSubmit, onCancel }: VoiceInputModalProps) {
    const [text, setText] = useState('');
    const inputRef = useRef<TextInput>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            setText('');
            setTimeout(() => inputRef.current?.focus(), 100);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [visible]);

    const handleSubmit = () => {
        if (text.trim()) { onSubmit(text.trim()); setText(''); }
    };

    const examples = [
        { icon: TrendingDown, color: Colors.status.expense, text: 'Gasté 15 dólares en almuerzo' },
        { icon: TrendingUp, color: Colors.status.income, text: 'Ingreso de 50 dólares' },
        { icon: DollarSign, color: Colors.accent.emerald, text: '10 en comida y 5 en taxi y 3 en café' },
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />

                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
                            <View style={styles.micCircle}>
                                <Mic size={28} color={Colors.accent.emerald} strokeWidth={1.5} />
                            </View>
                        </Animated.View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Registrar Transacción</Text>
                            <Text style={styles.subtitle}>Escribe como si hablaras</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                            <X size={20} color={Colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Examples */}
                    <View style={styles.examplesSection}>
                        <Text style={styles.examplesLabel}>EJEMPLOS</Text>
                        <View style={styles.examplesGrid}>
                            {examples.map((ex, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.exampleCard}
                                    onPress={() => setText(ex.text)}
                                    activeOpacity={0.7}
                                >
                                    <ex.icon size={16} color={ex.color} />
                                    <Text style={styles.exampleText} numberOfLines={1}>{ex.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Input */}
                    <View style={styles.inputSection}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                value={text}
                                onChangeText={setText}
                                placeholder="Ej: Gasté 20 dólares en comida"
                                placeholderTextColor={Colors.text.muted}
                                multiline
                                maxLength={200}
                                onSubmitEditing={handleSubmit}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={!text.trim()}
                                activeOpacity={0.8}
                            >
                                <ArrowUp size={22} color="#FFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
    container: {
        backgroundColor: Colors.background.primary,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    micContainer: { marginRight: 14 },
    micCircle: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    headerText: { flex: 1 },
    title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
    subtitle: { fontSize: 14, color: Colors.text.muted, marginTop: 2 },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Examples
    examplesSection: { padding: 20, paddingBottom: 12 },
    examplesLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.muted,
        letterSpacing: 1,
        marginBottom: 12,
    },
    examplesGrid: { gap: 8 },
    exampleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    exampleText: { fontSize: 14, color: Colors.text.secondary, flex: 1 },

    // Input
    inputSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        padding: 16,
        paddingTop: 16,
        fontSize: 16,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.default,
        maxHeight: 120,
        minHeight: 56,
    },
    sendButton: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: Colors.accent.emerald,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: { backgroundColor: Colors.background.tertiary, opacity: 0.5 },
});
