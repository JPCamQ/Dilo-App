// Dilo App - Edit Transaction Modal
import CategoryIcon from '@/components/ui/CategoryIcon';
import { Colors } from '@/constants/Colors';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { useAppStore } from '@/stores/useAppStore';
import { Transaction, TransactionType } from '@/types';
import { ArrowDownCircle, ArrowUpCircle, Check, Edit3, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface EditTransactionModalProps {
    visible: boolean;
    transaction: Transaction | null;
    onClose: () => void;
}

export default function EditTransactionModal({
    visible,
    transaction,
    onClose,
}: EditTransactionModalProps) {
    const { accounts, categories: storeCategories, updateTransaction, deleteTransaction, getEffectiveBcvRate } = useAppStore();

    // Use store categories (unified source)
    const allCategories = storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES;

    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>('expense');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [description, setDescription] = useState('');

    const bcvRate = getEffectiveBcvRate();

    // Load transaction data when modal opens
    useEffect(() => {
        if (transaction && visible) {
            setAmount(transaction.amountOriginal.toString());
            setType(transaction.type);
            setCategoryId(transaction.categoryId);
            setAccountId(transaction.accountId);
            setDescription(transaction.description);
        }
    }, [transaction, visible]);

    const categories = allCategories.filter(
        c => c.type === type || c.type === 'both'
    );

    const selectedAccount = accounts.find(a => a.id === accountId);
    const selectedCategory = allCategories.find(c => c.id === categoryId);

    const handleSave = () => {
        if (!transaction) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Error', 'Ingresa un monto válido');
            return;
        }

        if (!accountId) {
            Alert.alert('Error', 'Selecciona una cuenta');
            return;
        }

        if (!categoryId) {
            Alert.alert('Error', 'Selecciona una categoría');
            return;
        }

        // Calculate USD and VES amounts based on selected account currency
        let amountUsd = numAmount;
        let amountVes = numAmount * bcvRate;

        if (selectedAccount?.currency === 'VES') {
            amountVes = numAmount;
            amountUsd = numAmount / bcvRate;
        }

        updateTransaction(transaction.id, {
            amountOriginal: numAmount,
            amountUsd,
            amountVes,
            type,
            categoryId,
            accountId,
            description,
            bcvRateUsed: bcvRate,
        });

        Alert.alert('✓ Guardado', 'Transacción actualizada correctamente');
        onClose();
    };

    const handleDelete = () => {
        if (!transaction) return;

        Alert.alert(
            'Eliminar transacción',
            '¿Estás seguro de que quieres eliminar esta transacción?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        deleteTransaction(transaction.id);
                        onClose();
                    }
                }
            ]
        );
    };

    if (!transaction) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={Colors.text.secondary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitle}>
                            <Edit3 size={20} color={Colors.accent.primary} />
                            <Text style={styles.title}>Editar Transacción</Text>
                        </View>
                        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                            <Trash2 size={20} color={Colors.status.expense} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Type Selector */}
                        <Text style={styles.label}>Tipo</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                                onPress={() => setType('expense')}
                            >
                                <ArrowDownCircle size={20} color={type === 'expense' ? '#FFF' : Colors.text.muted} />
                                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                                    Gasto
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                                onPress={() => setType('income')}
                            >
                                <ArrowUpCircle size={20} color={type === 'income' ? '#FFF' : Colors.text.muted} />
                                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
                                    Ingreso
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount - Shows in the TRANSACTION's original currency */}
                        <Text style={styles.label}>Monto ({transaction?.currencyOriginal || 'USD'})</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.text.muted}
                        />

                        {/* Account Selector */}
                        <Text style={styles.label}>Cuenta</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
                            {accounts.map(account => (
                                <TouchableOpacity
                                    key={account.id}
                                    style={[
                                        styles.accountChip,
                                        accountId === account.id && styles.accountChipActive
                                    ]}
                                    onPress={() => setAccountId(account.id)}
                                >
                                    <Text style={styles.accountIcon}>{account.icon}</Text>
                                    <Text style={[
                                        styles.accountName,
                                        accountId === account.id && styles.accountNameActive
                                    ]}>
                                        {account.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Category Selector */}
                        <Text style={styles.label}>Categoría</Text>
                        <View style={styles.categoriesGrid}>
                            {categories.map(category => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryChip,
                                        categoryId === category.id && {
                                            backgroundColor: category.color,
                                            borderColor: category.color
                                        }
                                    ]}
                                    onPress={() => setCategoryId(category.id)}
                                >
                                    <CategoryIcon
                                        iconName={category.icon}
                                        size={16}
                                        color={categoryId === category.id ? '#FFF' : category.color}
                                    />
                                    <Text style={[
                                        styles.categoryName,
                                        categoryId === category.id && styles.categoryNameActive
                                    ]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Description */}
                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={styles.descInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Añadir nota..."
                            placeholderTextColor={Colors.text.muted}
                            multiline
                        />

                        {/* Save Button */}
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Check size={22} color="#FFF" />
                            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.background.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    closeBtn: { padding: 8 },
    deleteBtn: { padding: 8 },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    content: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: 8,
        marginTop: 16,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.background.tertiary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    typeBtnActiveExpense: {
        backgroundColor: Colors.status.expense,
        borderColor: Colors.status.expense,
    },
    typeBtnActiveIncome: {
        backgroundColor: Colors.status.income,
        borderColor: Colors.status.income,
    },
    typeBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.muted,
    },
    typeBtnTextActive: {
        color: '#FFF',
    },
    amountInput: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text.primary,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 12,
        padding: 16,
        textAlign: 'center',
    },
    accountsRow: {
        flexDirection: 'row',
    },
    accountChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: Colors.background.tertiary,
        borderWidth: 1,
        borderColor: Colors.border.default,
        marginRight: 10,
    },
    accountChipActive: {
        backgroundColor: Colors.accent.primary,
        borderColor: Colors.accent.primary,
    },
    accountIcon: { fontSize: 18 },
    accountName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    accountNameActive: { color: '#FFF' },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: Colors.background.tertiary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    categoryIcon: { fontSize: 16 },
    categoryName: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    categoryNameActive: { color: '#FFF' },
    descInput: {
        fontSize: 15,
        color: Colors.text.primary,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 12,
        padding: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.accent.primary,
        padding: 16,
        borderRadius: 14,
        marginTop: 24,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
