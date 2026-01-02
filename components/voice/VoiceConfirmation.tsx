// Dilo App - Voice Confirmation Modal (Fixed confirm button)
import { getCategoriesByType } from '@/constants/categories';
import { Colors } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import { Currency, ParsedVoiceCommand, Transaction, TransactionType } from '@/types';
import { Check, Mic, RotateCcw, Tag, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface VoiceConfirmationProps {
    visible: boolean;
    command: ParsedVoiceCommand | null;
    onConfirm: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
    onRetry: () => void;
}

const CURRENCIES: Currency[] = ['USD', 'VES', 'USDT', 'USDC'];

export default function VoiceConfirmation({ visible, command, onConfirm, onCancel, onRetry }: VoiceConfirmationProps) {
    const { accounts, currentBcvRate } = useAppStore();

    const [isEditing, setIsEditing] = useState(false); // Default to Preview Mode

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>('USD');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (command && visible) {
            setType(command.type);
            setAmount(command.amount.toString());
            setCurrency(command.currency);
            setCategoryId(command.category || 'other');
            setDescription(command.rawText);
            setIsEditing(false); // Reset to preview on new open

            // Auto-select first account if available
            if (accounts.length > 0) {
                const matched = command.account
                    ? accounts.find(a => a.name.toLowerCase().includes(command.account!.toLowerCase()))
                    : null;
                setAccountId(matched?.id || accounts[0].id);
            }
        }
    }, [command, accounts, visible]);

    const categories = getCategoriesByType(type);
    const selectedCategoryName = categories.find(c => c.id === categoryId)?.name || 'Otro';
    const selectedAccountName = accounts.find(a => a.id === accountId)?.name || 'Sin cuenta';

    const handleConfirm = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero');
            return;
        }

        const finalAccountId = accountId || accounts[0]?.id;
        if (!finalAccountId) {
            Alert.alert('Cuenta requerida', 'Selecciona o crea una cuenta');
            return;
        }

        let amountUsd = numAmount, amountVes = numAmount * (currentBcvRate || 51.50);
        if (currency === 'VES') {
            amountVes = numAmount;
            amountUsd = (currentBcvRate || 51.50) > 0 ? numAmount / (currentBcvRate || 51.50) : 0;
        }

        onConfirm({
            accountId: finalAccountId,
            categoryId: categoryId || 'other',
            type,
            amountOriginal: numAmount,
            currencyOriginal: currency,
            amountUsd,
            amountVes,
            bcvRateUsed: currentBcvRate || 51.50,
            description,
            voiceRaw: command?.rawText,
        });
    };

    // Check if confirm should be enabled
    const canConfirm = parseFloat(amount) > 0;

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Mic size={20} color={Colors.accent.emerald} />
                            </View>
                            <View>
                                <Text style={styles.title}>{isEditing ? 'Editar' : 'Confirmar'}</Text>
                                <Text style={styles.subtitle}>{isEditing ? 'Ajusta los detalles' : 'Revisa el resultado'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                            <X size={20} color={Colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Content Body */}
                    <View style={styles.body}>
                        {!isEditing ? (
                            // PREVIEW CARD MODE (Like MultiVoiceConfirmation)
                            <View>
                                <TouchableOpacity style={styles.previewCard} onPress={() => setIsEditing(true)} activeOpacity={0.9}>
                                    <View style={styles.cardLeft}>
                                        <View style={[
                                            styles.typeIndicator,
                                            { backgroundColor: type === 'income' ? Colors.status.income : Colors.status.expense }
                                        ]} />
                                        <View style={styles.cardContent}>
                                            <Text style={[
                                                styles.cardAmount,
                                                { color: type === 'income' ? Colors.status.income : Colors.status.expense }
                                            ]}>
                                                {type === 'expense' ? '-' : '+'}
                                                {currency === 'VES' ? 'Bs.' : '$'}{parseFloat(amount || '0').toFixed(2)}
                                            </Text>
                                            <View style={styles.cardMeta}>
                                                <Text style={styles.cardCategory}>{selectedCategoryName}</Text>
                                                <Text style={styles.cardDot}>•</Text>
                                                <Text style={styles.cardAccount}>{selectedAccountName}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.editIconBtn}>
                                        <Tag size={16} color={Colors.accent.emerald} />
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.previewNote}>
                                    <Text style={styles.previewNoteText} numberOfLines={2}>"{description}"</Text>
                                </View>
                            </View>
                        ) : (
                            // EDIT FORM MODE (Compact)
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Type Selector */}
                                <View style={styles.inputGroup}>
                                    <View style={styles.typeRow}>
                                        <TouchableOpacity
                                            style={[styles.typeButton, type === 'expense' && styles.typeButtonExpense]}
                                            onPress={() => setType('expense')}
                                        >
                                            <TrendingDown size={18} color={type === 'expense' ? '#FFF' : Colors.text.secondary} />
                                            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Gasto</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.typeButton, type === 'income' && styles.typeButtonIncome]}
                                            onPress={() => setType('income')}
                                        >
                                            <TrendingUp size={18} color={type === 'income' ? '#FFF' : Colors.text.secondary} />
                                            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Ingreso</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Amount & Currency */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Monto</Text>
                                    <View style={styles.amountRow}>
                                        <TextInput
                                            style={styles.amountInput}
                                            value={amount}
                                            onChangeText={setAmount}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                            placeholderTextColor={Colors.text.muted}
                                        />
                                        <View style={styles.currencyPicker}>
                                            {CURRENCIES.map((cur) => (
                                                <TouchableOpacity
                                                    key={cur}
                                                    style={[styles.currencyChip, currency === cur && styles.currencyChipActive]}
                                                    onPress={() => setCurrency(cur)}
                                                >
                                                    <Text style={[styles.currencyChipText, currency === cur && styles.currencyChipTextActive]}>{cur}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                {/* Account */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Cuenta</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.horizontalList}>
                                            {accounts.map((acc) => (
                                                <TouchableOpacity
                                                    key={acc.id}
                                                    style={[styles.accountChip, accountId === acc.id && styles.accountChipActive]}
                                                    onPress={() => setAccountId(acc.id)}
                                                >
                                                    <Wallet size={14} color={accountId === acc.id ? '#FFF' : Colors.text.muted} />
                                                    <Text style={[styles.accountChipText, accountId === acc.id && styles.accountChipTextActive]}>{acc.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>

                                {/* Category */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Categoría</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.horizontalList}>
                                            {categories.slice(0, 10).map((cat) => (
                                                <TouchableOpacity
                                                    key={cat.id}
                                                    style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipActive]}
                                                    onPress={() => setCategoryId(cat.id)}
                                                >
                                                    <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.footer}>
                        {isEditing ? (
                            <TouchableOpacity style={styles.retryButton} onPress={() => setIsEditing(false)} activeOpacity={0.7}>
                                <Check size={18} color={Colors.text.primary} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
                                <RotateCcw size={18} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
                            onPress={handleConfirm}
                            disabled={!canConfirm}
                            activeOpacity={0.8}
                        >
                            <Check size={20} color="#FFF" strokeWidth={2.5} />
                            <Text style={styles.confirmText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    container: { backgroundColor: Colors.background.primary, borderRadius: 20, width: '100%', maxHeight: '80%' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
    subtitle: { fontSize: 12, color: Colors.text.muted },
    closeButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.background.secondary, justifyContent: 'center', alignItems: 'center' },


    // Preview Card Styles
    previewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary, borderRadius: 16, padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.default },
    cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    typeIndicator: { width: 5, height: '100%', minHeight: 70 },
    cardContent: { padding: 12, paddingLeft: 12, flex: 1 },
    cardAmount: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    cardCategory: { fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
    cardDot: { fontSize: 12, color: Colors.text.muted, marginHorizontal: 6 },
    cardAccount: { fontSize: 13, color: Colors.text.muted },
    editIconBtn: { padding: 16, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: Colors.border.default, backgroundColor: Colors.background.tertiary },
    previewNote: { marginTop: 12, padding: 12, backgroundColor: Colors.background.tertiary, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: Colors.text.muted },
    previewNoteText: { fontSize: 13, color: Colors.text.secondary, fontStyle: 'italic' },

    transcriptCard: { marginHorizontal: 16, padding: 12, backgroundColor: Colors.background.secondary, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.accent.emerald, marginBottom: 8 },
    transcriptText: { fontSize: 13, color: Colors.text.secondary, fontStyle: 'italic' },

    body: { padding: 16, paddingTop: 8 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '600', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },

    typeRow: { flexDirection: 'row', gap: 8 },
    typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
    typeButtonExpense: { backgroundColor: Colors.status.expense, borderColor: Colors.status.expense },
    typeButtonIncome: { backgroundColor: Colors.status.income, borderColor: Colors.status.income },
    typeText: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },
    typeTextActive: { color: '#FFF' },

    amountRow: { flexDirection: 'row', gap: 8 },
    amountInput: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.text.primary, backgroundColor: Colors.background.secondary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border.default },
    currencyPicker: { justifyContent: 'space-between', gap: 4 },
    currencyChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.background.secondary },
    currencyChipActive: { backgroundColor: Colors.accent.primary },
    currencyChipText: { fontSize: 10, fontWeight: '600', color: Colors.text.muted },
    currencyChipTextActive: { color: '#FFF' },

    horizontalList: { flexDirection: 'row', gap: 6 },
    accountChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
    accountChipActive: { backgroundColor: Colors.accent.emerald, borderColor: Colors.accent.emerald },
    accountChipText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary },
    accountChipTextActive: { color: '#FFF' },
    noAccountsText: { fontSize: 13, color: Colors.status.expense, fontStyle: 'italic' },
    categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
    categoryChipActive: { backgroundColor: Colors.accent.emerald, borderColor: Colors.accent.emerald },
    categoryChipText: { fontSize: 12, fontWeight: '500', color: Colors.text.secondary },
    categoryChipTextActive: { color: '#FFF' },

    noteInput: { backgroundColor: Colors.background.secondary, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.default, minHeight: 50, textAlignVertical: 'top' },

    footer: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border.default },
    retryButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
    confirmButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, backgroundColor: Colors.accent.emerald },
    confirmButtonDisabled: { opacity: 0.5 },
    confirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
