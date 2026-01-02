// Dilo App - Multi-Transaction Voice Confirmation
// Confirma múltiples transacciones - cada una con su propia cuenta

import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import { ParsedVoiceCommand, Transaction } from '@/types';
import { Check, ChevronDown, Mic, Trash2, Wallet, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MultiVoiceConfirmationProps {
    visible: boolean;
    commands: ParsedVoiceCommand[];
    onConfirmAll: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
    onCancel: () => void;
    onRemoveItem: (index: number) => void;
}

export default function MultiVoiceConfirmation({
    visible,
    commands,
    onConfirmAll,
    onCancel,
    onRemoveItem
}: MultiVoiceConfirmationProps) {
    const { accounts, getEffectiveBcvRate } = useAppStore();
    const bcvRate = getEffectiveBcvRate();

    // State for account selection per transaction
    const [selectedAccounts, setSelectedAccounts] = useState<Record<number, string>>({});
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    // Initialize accounts based on detected accounts
    useEffect(() => {
        if (visible && commands.length > 0) {
            const initial: Record<number, string> = {};
            commands.forEach((cmd, idx) => {
                // Try to match detected account name to actual account
                if (cmd.account) {
                    const matched = accounts.find(a =>
                        a.name.toLowerCase().includes(cmd.account!.toLowerCase())
                    );
                    initial[idx] = matched?.id || accounts[0]?.id || '';
                } else {
                    initial[idx] = accounts[0]?.id || '';
                }
            });
            setSelectedAccounts(initial);
            setExpandedIndex(null);
        }
    }, [visible, commands, accounts]);

    const getCategoryName = (categoryId?: string): string => {
        if (!categoryId) return 'Otro';
        const cat = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
        return cat?.name || 'Otro';
    };

    const getAccountName = (accountId: string): string => {
        return accounts.find(a => a.id === accountId)?.name || 'Sin cuenta';
    };

    const handleAccountSelect = (index: number, accountId: string) => {
        setSelectedAccounts(prev => ({ ...prev, [index]: accountId }));
        setExpandedIndex(null);
    };

    const handleConfirmAll = () => {
        if (accounts.length === 0) return;

        const transactions = commands.map((cmd, idx) => {
            let amountUsd = cmd.amount;
            let amountVes = cmd.amount * bcvRate;

            if (cmd.currency === 'VES') {
                amountVes = cmd.amount;
                amountUsd = bcvRate > 0 ? cmd.amount / bcvRate : 0;
            }

            return {
                accountId: selectedAccounts[idx] || accounts[0].id,
                categoryId: cmd.category || 'other',
                type: cmd.type,
                amountOriginal: cmd.amount,
                currencyOriginal: cmd.currency,
                amountUsd,
                amountVes,
                bcvRateUsed: bcvRate,
                description: cmd.rawText,
                voiceRaw: cmd.rawText,
            };
        });

        onConfirmAll(transactions);
    };

    // Calculate totals
    const totalUsd = commands.reduce((sum, cmd) => {
        if (cmd.currency === 'USD') return sum + cmd.amount;
        if (cmd.currency === 'VES') return sum + (cmd.amount / bcvRate);
        return sum + cmd.amount;
    }, 0);

    if (!visible || commands.length === 0) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />

                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Mic size={20} color={Colors.accent.emerald} />
                            </View>
                            <View>
                                <Text style={styles.title}>{commands.length} Transacciones</Text>
                                <Text style={styles.subtitle}>Toca cada cuenta para cambiar</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                            <X size={20} color={Colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Transaction List */}
                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                        {commands.map((cmd, index) => (
                            <View key={index} style={styles.transactionCard}>
                                {/* Main transaction info */}
                                <View style={styles.cardMain}>
                                    <View style={styles.cardLeft}>
                                        <View style={[
                                            styles.typeIndicator,
                                            { backgroundColor: cmd.type === 'income' ? Colors.status.income : Colors.status.expense }
                                        ]} />
                                        <View style={styles.cardContent}>
                                            <Text style={[
                                                styles.cardAmount,
                                                { color: cmd.type === 'income' ? Colors.status.income : Colors.status.expense }
                                            ]}>
                                                {cmd.type === 'expense' ? '-' : '+'}
                                                {cmd.currency === 'VES' ? 'Bs.' : '$'}{cmd.amount.toFixed(2)}
                                            </Text>
                                            <Text style={styles.cardCategory}>{getCategoryName(cmd.category)}</Text>
                                        </View>
                                    </View>

                                    {/* Account selector button */}
                                    <TouchableOpacity
                                        style={styles.accountBtn}
                                        onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                    >
                                        <Wallet size={14} color={Colors.accent.emerald} />
                                        <Text style={styles.accountBtnText} numberOfLines={1}>
                                            {getAccountName(selectedAccounts[index] || '')}
                                        </Text>
                                        <ChevronDown size={14} color={Colors.text.muted} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => onRemoveItem(index)}
                                    >
                                        <Trash2 size={16} color={Colors.status.expense} />
                                    </TouchableOpacity>
                                </View>

                                {/* Expanded account selector */}
                                {expandedIndex === index && (
                                    <View style={styles.accountDropdown}>
                                        {accounts.map(acc => (
                                            <TouchableOpacity
                                                key={acc.id}
                                                style={[
                                                    styles.accountOption,
                                                    selectedAccounts[index] === acc.id && styles.accountOptionActive
                                                ]}
                                                onPress={() => handleAccountSelect(index, acc.id)}
                                            >
                                                <Text style={[
                                                    styles.accountOptionText,
                                                    selectedAccounts[index] === acc.id && styles.accountOptionTextActive
                                                ]}>{acc.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Summary */}
                    <View style={styles.summary}>
                        <Text style={styles.summaryLabel}>Total estimado:</Text>
                        <Text style={styles.summaryValue}>${totalUsd.toFixed(2)}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, accounts.length === 0 && styles.confirmButtonDisabled]}
                            onPress={handleConfirmAll}
                            disabled={accounts.length === 0}
                        >
                            <Check size={20} color="#FFF" strokeWidth={2.5} />
                            <Text style={styles.confirmText}>Confirmar Todas</Text>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: Colors.background.primary,
        borderRadius: 24,
        width: '100%',
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
    subtitle: { fontSize: 13, color: Colors.text.muted, marginTop: 1 },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center'
    },

    list: {
        paddingHorizontal: 16,
        paddingTop: 12,
        maxHeight: 280,
    },

    transactionCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    typeIndicator: {
        width: 4,
        height: '100%',
        minHeight: 56,
    },
    cardContent: {
        padding: 12,
        flex: 1,
    },
    cardAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardCategory: {
        fontSize: 12,
        color: Colors.text.muted,
        marginTop: 2,
    },

    accountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.background.tertiary,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        maxWidth: 100,
    },
    accountBtnText: {
        fontSize: 11,
        color: Colors.accent.emerald,
        fontWeight: '600',
        flex: 1,
    },

    removeButton: {
        padding: 12,
    },

    accountDropdown: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 12,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },
    accountOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.background.tertiary,
    },
    accountOptionActive: {
        backgroundColor: Colors.accent.emerald,
    },
    accountOptionText: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    accountOptionTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },

    summary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.background.secondary,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.accent.emerald,
    },

    footer: {
        flexDirection: 'row',
        gap: 10,
        padding: 16,
        paddingTop: 12,
    },
    cancelButton: {
        flex: 0.35,
        padding: 14,
        borderRadius: 14,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    confirmButton: {
        flex: 0.65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 14,
        backgroundColor: Colors.accent.emerald
    },
    confirmButtonDisabled: { opacity: 0.5 },
    confirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
