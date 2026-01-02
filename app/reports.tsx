import ExpensePieChart from '@/components/charts/ExpensePieChart';
import ExportModal from '@/components/export/ExportModal';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/Colors';
import { formatUsd, formatVes } from '@/services/bcv';
import { useAppStore } from '@/stores/useAppStore';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Download, PieChart as PieChartIcon, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportsScreen() {
    const { transactions, getDashboardStats, getEffectiveBcvRate, getTotalBalanceUsd, getTotalBalanceVes, accounts, categories } = useAppStore();
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [showExport, setShowExport] = useState(false);

    const stats = getDashboardStats();
    const bcvRate = getEffectiveBcvRate();
    const totalUsd = getTotalBalanceUsd();
    const totalVes = getTotalBalanceVes();

    // Filter transactions by period
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        switch (selectedPeriod) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        return transactions.filter(t => new Date(t.createdAt) >= startDate);
    }, [transactions, selectedPeriod]);

    // Calculate totals for period
    const periodStats = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amountUsd, 0);
        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amountUsd, 0);
        return { income, expense, balance: income - expense };
    }, [filteredTransactions]);

    // Expenses by category
    const expensesByCategory = useMemo(() => {
        const totals: Record<string, number> = {};
        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const catId = t.categoryId || 'other';
                totals[catId] = (totals[catId] || 0) + t.amountUsd;
            });

        const total = Object.values(totals).reduce((a, b) => a + b, 0);

        return Object.entries(totals)
            .map(([id, value]) => {
                const category = DEFAULT_CATEGORIES.find(c => c.id === id);
                return {
                    id,
                    name: category?.name || 'Otros',
                    color: category?.color || '#94A3B8',
                    icon: category?.icon || '📦',
                    value,
                    percentage: total > 0 ? (value / total) * 100 : 0,
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredTransactions]);

    const totalExpenses = expensesByCategory.reduce((sum, c) => sum + c.value, 0);

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'week': return 'Esta semana';
            case 'month': return 'Este mes';
            case 'year': return 'Este año';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Header with Back Arrow */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reportes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[styles.periodBtnText, selectedPeriod === period && styles.periodBtnTextActive]}>
                                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Calendar size={16} color={Colors.text.muted} />
                        <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <TrendingUp size={18} color={Colors.status.income} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Ingresos</Text>
                                <Text style={[styles.summaryValue, { color: Colors.status.income }]}>
                                    {formatUsd(periodStats.income)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <TrendingDown size={18} color={Colors.status.expense} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Gastos</Text>
                                <Text style={[styles.summaryValue, { color: Colors.status.expense }]}>
                                    {formatUsd(periodStats.expense)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Balance del período</Text>
                        <Text style={[
                            styles.balanceValue,
                            { color: periodStats.balance >= 0 ? Colors.status.income : Colors.status.expense }
                        ]}>
                            {periodStats.balance >= 0 ? '+' : ''}{formatUsd(periodStats.balance)}
                        </Text>
                    </View>
                </View>

                {/* Total Balance Card */}
                <View style={styles.totalCard}>
                    <View style={styles.totalHeader}>
                        <Wallet size={18} color={Colors.accent.primary} />
                        <Text style={styles.totalTitle}>Patrimonio Total</Text>
                    </View>
                    <Text style={styles.totalUsd}>{formatUsd(totalUsd)}</Text>
                    <Text style={styles.totalVes}>Bs. {formatVes(totalVes)}</Text>
                    <View style={styles.totalInfo}>
                        <Text style={styles.totalInfoText}>{accounts.length} cuentas activas</Text>
                        <View style={styles.rateChip}>
                            <TrendingUp size={12} color={Colors.accent.primary} />
                            <Text style={styles.rateChipText}>Bs. {bcvRate.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Category Breakdown - Pie Chart */}
                <View style={styles.categorySection}>
                    <View style={styles.sectionHeader}>
                        <PieChartIcon size={18} color={Colors.text.secondary} />
                        <Text style={styles.sectionTitle}>Distribución de Gastos</Text>
                    </View>

                    <ExpensePieChart
                        transactions={filteredTransactions}
                        categories={categories}
                    />
                </View>

                {/* Transaction Count */}
                <View style={styles.statsRow}>
                    <View style={styles.statMini}>
                        <Text style={styles.statMiniValue}>{filteredTransactions.length}</Text>
                        <Text style={styles.statMiniLabel}>Transacciones</Text>
                    </View>
                    <View style={styles.statMini}>
                        <Text style={styles.statMiniValue}>
                            {filteredTransactions.filter(t => t.type === 'income').length}
                        </Text>
                        <Text style={styles.statMiniLabel}>Ingresos</Text>
                    </View>
                    <View style={styles.statMini}>
                        <Text style={styles.statMiniValue}>
                            {filteredTransactions.filter(t => t.type === 'expense').length}
                        </Text>
                        <Text style={styles.statMiniLabel}>Gastos</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.exportFab}
                onPress={() => setShowExport(true)}
            >
                <Download size={24} color="#FFF" />
            </TouchableOpacity>

            <ExportModal
                visible={showExport}
                onClose={() => setShowExport(false)}
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

    content: { flex: 1, paddingHorizontal: 16 },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: Colors.background.secondary,
        borderRadius: 18,
        padding: 4,
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    periodBtnActive: {
        backgroundColor: Colors.accent.primary,
    },
    periodBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.muted,
    },
    periodBtnTextActive: {
        color: '#FFF',
    },

    // Summary Card
    summaryCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    summaryPeriod: {
        fontSize: 14,
        color: Colors.text.muted,
        fontWeight: '500',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.text.muted,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border.default,
        marginHorizontal: 16,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },
    balanceLabel: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: '700',
    },

    // Total Card
    totalCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        padding: 20,
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
        position: 'relative',
        overflow: 'hidden',
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    totalTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.accent.primary,
    },
    totalUsd: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    totalVes: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    totalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    totalInfoText: {
        fontSize: 13,
        color: Colors.text.muted,
    },
    rateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rateChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.accent.primary,
    },

    // Category Section
    categorySection: {
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    categoryCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    ringContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    ringOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: Colors.status.expense,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringInner: {
        alignItems: 'center',
    },
    ringValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    ringLabel: {
        fontSize: 12,
        color: Colors.text.muted,
    },
    categoryList: {
        gap: 12,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 14,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    categoryBar: {
        height: 6,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    categoryBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    categoryStats: {
        alignItems: 'flex-end',
    },
    categoryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    categoryPercent: {
        fontSize: 11,
        color: Colors.text.muted,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginTop: 12,
    },
    emptyHint: {
        fontSize: 13,
        color: Colors.text.muted,
        marginTop: 4,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    statMini: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
        borderRadius: 18,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    statMiniValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    statMiniLabel: {
        fontSize: 11,
        color: Colors.text.muted,
        marginTop: 4,
        fontWeight: '600',
    },
    exportFab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
});
