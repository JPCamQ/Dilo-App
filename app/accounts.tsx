// Dilo App - Accounts Screen (With Edit & Keyboard Fix)
import { Colors } from '@/constants/Colors';
import { formatUsd, formatVes } from '@/services/bcv';
import { useAppStore } from '@/stores/useAppStore';
import { Account, AccountType, Currency } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Building2, CreditCard, DollarSign, Edit3, Plus, Smartphone, Trash2, Wallet, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CURRENCIES: { id: Currency; label: string; symbol: string }[] = [
    { id: 'USD', label: 'USD', symbol: '$' },
    { id: 'VES', label: 'VES', symbol: 'Bs.' },
    { id: 'USDT', label: 'USDT', symbol: '₮' },
    { id: 'USDC', label: 'USDC', symbol: '$' },
];

const ACCOUNT_TYPES: { type: AccountType; icon: React.ElementType; label: string; description: string }[] = [
    { type: 'cash', icon: Wallet, label: 'Efectivo', description: 'Dinero en mano' },
    { type: 'bank', icon: Building2, label: 'Banco', description: 'Banesco, Mercantil...' },
    { type: 'digital', icon: Smartphone, label: 'Digital', description: 'Zinli, Zelle, PayPal' },
    { type: 'crypto', icon: DollarSign, label: 'Binance', description: 'USDT, USDC' },
];

export default function AccountsScreen() {
    const { accounts, addAccount, updateAccount, deleteAccount } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'bank' as AccountType,
        currency: 'USD' as Currency,
        balance: ''
    });

    const resetForm = () => {
        setNewAccount({ name: '', type: 'bank', currency: 'USD', balance: '' });
        setEditingAccount(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setNewAccount({
            name: account.name,
            type: account.type,
            currency: account.currency,
            balance: account.balance.toString()
        });
        setIsModalOpen(true);
    };

    const handleSaveAccount = () => {
        if (!newAccount.name.trim()) {
            Alert.alert('Nombre requerido', 'Ingresa un nombre para la cuenta');
            return;
        }

        if (editingAccount) {
            // Update existing
            updateAccount(editingAccount.id, {
                name: newAccount.name.trim(),
                type: newAccount.type,
                currency: newAccount.currency,
                balance: parseFloat(newAccount.balance) || 0,
                updatedAt: new Date()
            });
        } else {
            // Create new
            const account: Account = {
                id: Date.now().toString(),
                name: newAccount.name.trim(),
                type: newAccount.type,
                currency: newAccount.currency,
                balance: parseFloat(newAccount.balance) || 0,
                icon: '🏦',
                color: Colors.accent.primary,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            addAccount(account);
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDeleteAccount = (id: string, name: string) => {
        Alert.alert(
            'Eliminar cuenta',
            `¿Estás seguro de eliminar "${name}"?\n\nEsta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => deleteAccount(id) }
            ]
        );
    };

    const getAccountIcon = (type: AccountType) => {
        const accountType = ACCOUNT_TYPES.find(t => t.type === type);
        const IconComponent = accountType?.icon || Wallet;
        const iconColor = type === 'bank' ? Colors.accent.primary :
            type === 'crypto' ? '#F0B90B' :
                type === 'digital' ? '#7C3AED' :
                    Colors.accent.primary;
        return <IconComponent size={22} color={iconColor} />;
    };

    const renderAccount = ({ item }: { item: Account }) => (
        <View style={styles.accountCard}>
            <View style={[styles.accountIcon, {
                backgroundColor: item.type === 'bank' ? 'rgba(59, 130, 246, 0.1)' :
                    item.type === 'crypto' ? 'rgba(240, 185, 11, 0.1)' :
                        item.type === 'digital' ? 'rgba(124, 58, 237, 0.1)' :
                            'rgba(16, 185, 129, 0.1)'
            }]}>
                {getAccountIcon(item.type)}
            </View>
            <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{item.name}</Text>
                <Text style={styles.accountType}>
                    {ACCOUNT_TYPES.find(t => t.type === item.type)?.label} • {item.currency}
                </Text>
            </View>
            <View style={styles.accountBalance}>
                <Text style={styles.balanceAmount}>
                    {item.currency === 'VES' ? `Bs. ${formatVes(item.balance)}` :
                        item.currency === 'USD' ? formatUsd(item.balance) :
                            `${item.balance.toFixed(2)} ${item.currency}`}
                </Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                <Edit3 size={16} color={Colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAccount(item.id, item.name)}>
                <Trash2 size={16} color={Colors.status.expense} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Header with Back Arrow */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cuentas</Text>
                <View style={{ width: 40 }} />
            </View>

            <TouchableOpacity onPress={openCreateModal} activeOpacity={0.8}>
                <LinearGradient
                    colors={Colors.premium.actionGradient}
                    style={styles.addButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Plus size={20} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.addButtonText}>Nueva cuenta</Text>
                </LinearGradient>
            </TouchableOpacity>

            {accounts.length > 0 ? (
                <FlatList
                    data={accounts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAccount}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <CreditCard size={48} color={Colors.text.muted} strokeWidth={1} />
                    </View>
                    <Text style={styles.emptyTitle}>Sin cuentas</Text>
                    <Text style={styles.emptyText}>Agrega tu primera cuenta para comenzar</Text>
                </View>
            )}



            {/* Create/Edit Modal with KeyboardAvoidingView */}
            <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {editingAccount ? 'Modifica los datos de la cuenta' : 'Agrega una cuenta para gestionar tu dinero'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.closeButton} onPress={() => { setIsModalOpen(false); resetForm(); }}>
                                <X size={22} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nombre de la cuenta</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ej: Banesco, Zinli, Binance"
                                    placeholderTextColor={Colors.text.muted}
                                    value={newAccount.name}
                                    onChangeText={(t) => setNewAccount({ ...newAccount, name: t })}
                                />
                            </View>

                            {/* Account Type */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Tipo de cuenta</Text>
                                <View style={styles.typeGrid}>
                                    {ACCOUNT_TYPES.map((at) => {
                                        const IconComp = at.icon;
                                        const isSelected = newAccount.type === at.type;
                                        return (
                                            <TouchableOpacity
                                                key={at.type}
                                                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                                                onPress={() => setNewAccount({ ...newAccount, type: at.type })}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.typeIconContainer, isSelected && styles.typeIconSelected]}>
                                                    <IconComp size={20} color={isSelected ? '#FFF' : Colors.text.secondary} />
                                                </View>
                                                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>{at.label}</Text>
                                                <Text style={styles.typeDescription}>{at.description}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Currency */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Moneda</Text>
                                <View style={styles.currencyGrid}>
                                    {CURRENCIES.map((c) => {
                                        const isSelected = newAccount.currency === c.id;
                                        return (
                                            <TouchableOpacity
                                                key={c.id}
                                                style={[styles.currencyCard, isSelected && styles.currencyCardSelected]}
                                                onPress={() => setNewAccount({ ...newAccount, currency: c.id })}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.currencySymbol, isSelected && styles.currencySymbolSelected]}>{c.symbol}</Text>
                                                <Text style={[styles.currencyLabel, isSelected && styles.currencyLabelSelected]}>{c.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Balance */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    {editingAccount ? 'Saldo actual' : 'Saldo inicial (opcional)'}
                                </Text>
                                <TextInput
                                    style={[styles.textInput, styles.balanceInput]}
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.text.muted}
                                    keyboardType="decimal-pad"
                                    value={newAccount.balance}
                                    onChangeText={(t) => setNewAccount({ ...newAccount, balance: t })}
                                />
                            </View>

                            <View style={{ height: 40 }} />
                        </ScrollView>

                        {/* Submit Button */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity onPress={handleSaveAccount} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={Colors.premium.actionGradient}
                                    style={styles.submitButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background.primary },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { padding: 8 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    menuBtn: { padding: 8 },

    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 16,
        borderRadius: 14,
        // Premium Shadow
        shadowColor: Colors.premium.actionShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },

    listContent: { paddingHorizontal: 16, paddingBottom: 100 },

    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    accountIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    accountInfo: { flex: 1 },
    accountName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
    accountType: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
    accountBalance: { marginRight: 8 },
    balanceAmount: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
    editButton: { padding: 8 },
    deleteButton: { padding: 8 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary },
    emptyText: { fontSize: 15, color: Colors.text.muted, textAlign: 'center', marginTop: 8, lineHeight: 22 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: Colors.background.primary,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    modalTitle: { fontSize: 24, fontWeight: '700', color: Colors.text.primary },
    modalSubtitle: { fontSize: 14, color: Colors.text.muted, marginTop: 4 },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: { padding: 24 },
    modalFooter: {
        padding: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },

    inputGroup: { marginBottom: 24 },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 18,
        padding: 18,
        fontSize: 16,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    balanceInput: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        color: Colors.accent.primary,
    },

    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    typeCard: {
        width: '48%',
        padding: 14,
        borderRadius: 18,
        backgroundColor: Colors.background.secondary,
        borderWidth: 1.5,
        borderColor: Colors.premium.glassBorder,
    },
    typeCardSelected: {
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        borderColor: Colors.accent.primary,
    },
    typeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeIconSelected: {
        backgroundColor: Colors.accent.primary,
    },
    typeLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
    typeLabelSelected: { color: Colors.accent.primary },
    typeDescription: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },

    currencyGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    currencyCard: {
        flex: 1,
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.background.secondary,
        borderWidth: 1.5,
        borderColor: Colors.border.default,
    },
    currencyCardSelected: {
        backgroundColor: Colors.accent.primary,
        borderColor: Colors.accent.primary,
    },
    currencySymbol: { fontSize: 18, fontWeight: '700', color: Colors.text.secondary },
    currencySymbolSelected: { color: '#FFF' },
    currencyLabel: { fontSize: 12, fontWeight: '500', color: Colors.text.muted, marginTop: 4 },
    currencyLabelSelected: { color: 'rgba(255,255,255,0.8)' },

    submitButton: {
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        // Premium Shadow
        shadowColor: Colors.premium.actionShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
