// Dilo App - Voice Keywords Management Screen
// Editar palabras clave para detección de cuentas por voz

import { Colors } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Info, Plus, Trash2, Wallet, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VoiceKeywordsScreen() {
    const { bankKeywords, addBankKeyword, removeBankKeyword, setBankKeywords } = useAppStore();
    const [newBank, setNewBank] = useState('');
    const [newKeyword, setNewKeyword] = useState('');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    const handleAddBank = () => {
        if (!newBank.trim()) return;
        const bankName = newBank.toLowerCase().trim();
        if (bankKeywords[bankName]) {
            Alert.alert('Ya existe', 'Este banco ya está en la lista');
            return;
        }
        setBankKeywords({ ...bankKeywords, [bankName]: [bankName] });
        setNewBank('');
    };

    const handleAddKeyword = (bank: string) => {
        if (!newKeyword.trim()) return;
        addBankKeyword(bank, newKeyword);
        setNewKeyword('');
    };

    const handleRemoveBank = (bank: string) => {
        Alert.alert(
            'Eliminar Banco',
            `¿Eliminar "${bank}" y todas sus palabras clave?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        const updated = { ...bankKeywords };
                        delete updated[bank];
                        setBankKeywords(updated);
                        if (selectedBank === bank) setSelectedBank(null);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Palabras Clave</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Description */}
                <View style={styles.infoCard}>
                    <View style={styles.infoTitleRow}>
                        <Info size={18} color={Colors.accent.primary} />
                        <Text style={styles.infoText}>
                            Cuando dices "35 de <Text style={styles.highlight}>Banesco</Text>",
                            la app detecta automáticamente la cuenta usando estas palabras clave.
                        </Text>
                    </View>
                </View>

                {/* Add New Bank */}
                <View style={styles.addSection}>
                    <Text style={styles.addLabel}>Agregar Nuevo Banco</Text>
                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.addInput}
                            value={newBank}
                            onChangeText={setNewBank}
                            placeholder="Ej: Banco de Venezuela"
                            placeholderTextColor={Colors.text.muted}
                        />
                        <TouchableOpacity onPress={handleAddBank} activeOpacity={0.8}>
                            <LinearGradient
                                colors={Colors.premium.actionGradient}
                                style={styles.addBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Plus size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bank List */}
                <View style={styles.bankList}>
                    {Object.entries(bankKeywords).map(([bank, keywords]) => (
                        <View key={bank} style={styles.bankCard}>
                            {/* Bank Header */}
                            <TouchableOpacity
                                style={styles.bankHeader}
                                onPress={() => setSelectedBank(selectedBank === bank ? null : bank)}
                            >
                                <View style={styles.bankInfo}>
                                    <Wallet size={18} color={Colors.accent.primary} />
                                    <Text style={styles.bankName}>{bank}</Text>
                                </View>
                                <View style={styles.bankActions}>
                                    <Text style={styles.keywordCount}>{keywords.length} keywords</Text>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleRemoveBank(bank)}
                                    >
                                        <Trash2 size={16} color={Colors.status.expense} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>

                            {/* Keywords (Expanded) */}
                            {selectedBank === bank && (
                                <View style={styles.keywordsExpanded}>
                                    <View style={styles.keywordsList}>
                                        {keywords.map((kw, idx) => (
                                            <View key={idx} style={styles.keywordChip}>
                                                <Text style={styles.keywordText}>{kw}</Text>
                                                <TouchableOpacity
                                                    onPress={() => removeBankKeyword(bank, kw)}
                                                    style={styles.removeKeywordBtn}
                                                >
                                                    <X size={12} color={Colors.text.muted} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Add keyword */}
                                    <View style={styles.addKeywordRow}>
                                        <TextInput
                                            style={styles.addKeywordInput}
                                            value={newKeyword}
                                            onChangeText={setNewKeyword}
                                            placeholder="Nueva palabra clave..."
                                            placeholderTextColor={Colors.text.muted}
                                        />
                                        <TouchableOpacity
                                            style={styles.addKeywordBtn}
                                            onPress={() => handleAddKeyword(bank)}
                                        >
                                            <Plus size={16} color={Colors.accent.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background.primary },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },

    content: { flex: 1, padding: 16 },

    infoCard: {
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(14, 165, 233, 0.2)',
    },
    infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22, flex: 1 },
    highlight: { color: Colors.accent.primary, fontWeight: '600' },

    addSection: { marginBottom: 24 },
    addLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted, marginBottom: 10, textTransform: 'uppercase' },
    addRow: { flexDirection: 'row', gap: 10 },
    addInput: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        // Premium Shadow
        shadowColor: Colors.premium.actionShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },

    bankList: { gap: 12 },
    bankCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    bankHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    bankInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bankName: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, textTransform: 'capitalize' },
    bankActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    keywordCount: { fontSize: 12, color: Colors.text.muted },
    deleteBtn: { padding: 6 },

    keywordsExpanded: {
        padding: 14,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },
    keywordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    keywordChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.background.tertiary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    keywordText: { fontSize: 13, color: Colors.text.secondary },
    removeKeywordBtn: { padding: 2 },

    addKeywordRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    addKeywordInput: {
        flex: 1,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        color: Colors.text.primary,
    },
    addKeywordBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.accent.primary,
    },
});
