import EditTransactionModal from '@/components/transactions/EditTransactionModal';
import TransactionItem from '@/components/transactions/TransactionItem';
import { Colors } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import { Transaction } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, LayoutList, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
    const { transactions } = useAppStore();
    const params = useLocalSearchParams<{ filter?: string }>();
    const [filter, setFilter] = useState<FilterType>('all');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Apply filter from URL params
    useEffect(() => {
        if (params.filter === 'income' || params.filter === 'expense') {
            setFilter(params.filter);
        }
    }, [params.filter]);

    const filteredTransactions = transactions.filter((t) => filter === 'all' ? true : t.type === filter);
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = new Date(transaction.createdAt).toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, typeof transactions>);
    const sections = Object.entries(groupedTransactions).map(([date, data]) => ({ date, data }));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Header with Back Arrow */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.filters}>
                {[{ key: 'all', label: 'Todos', icon: <LayoutList size={16} color={filter === 'all' ? '#FFF' : Colors.text.secondary} /> },
                { key: 'income', label: 'Ingresos', icon: <TrendingUp size={16} color={filter === 'income' ? '#FFF' : Colors.status.income} /> },
                { key: 'expense', label: 'Gastos', icon: <TrendingDown size={16} color={filter === 'expense' ? '#FFF' : Colors.status.expense} /> }
                ].map((f) => (
                    <TouchableOpacity key={f.key} style={[styles.filterPill, filter === f.key && styles.filterPillActive]} onPress={() => setFilter(f.key as FilterType)}>
                        {f.icon}<Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {sections.length > 0 ? (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item.date}
                    renderItem={({ item }) => (
                        <View style={styles.section}>
                            <Text style={styles.sectionDate}>{item.date}</Text>
                            {item.data.map((t) => (
                                <TransactionItem
                                    key={t.id}
                                    transaction={t}
                                    showDate={false}
                                    onPress={() => setEditingTransaction(t)}
                                />
                            ))}
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyState}>
                    <LayoutList size={48} color={Colors.text.muted} />
                    <Text style={styles.emptyTitle}>Sin transacciones</Text>
                </View>
            )}

            {/* Edit Transaction Modal */}
            <EditTransactionModal
                visible={!!editingTransaction}
                transaction={editingTransaction}
                onClose={() => setEditingTransaction(null)}
            />
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

    filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
    filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
    filterPillActive: {
        backgroundColor: Colors.accent.primary,
        borderColor: Colors.accent.primary,
        shadowColor: Colors.premium.actionShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    filterText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary },
    filterTextActive: { color: '#FFF' },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    section: { marginBottom: 20 },
    sectionDate: { fontSize: 13, fontWeight: '600', color: Colors.text.muted, textTransform: 'capitalize', marginBottom: 10 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text.primary, marginTop: 16 },
});

