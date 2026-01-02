// Dilo App - Transaction Item (Premium Design)
// Elemento profesional para transacciones

import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/Colors';
import { formatUsd } from '@/services/bcv';
import { Transaction } from '@/types';
import {
    ArrowLeftRight,
    Briefcase,
    BriefcaseMedical,
    Car,
    Circle,
    DollarSign,
    FileText,
    Fuel,
    Gift,
    GraduationCap,
    Home,
    Laptop,
    ShoppingCart,
    Smartphone,
    Store,
    TrendingUp,
    Tv,
    User,
    Utensils,
    Zap
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TransactionItemProps {
    transaction: Transaction;
    onPress?: () => void;
    showDate?: boolean;
}

// Category icons mapping - covers ALL categories
const CategoryIcon = ({ categoryId, size = 20 }: { categoryId: string; size?: number }) => {
    const iconColor = Colors.text.primary;

    switch (categoryId) {
        // Expenses
        case 'food':
            return <Utensils size={size} color={iconColor} />;
        case 'transport':
            return <Car size={size} color={iconColor} />;
        case 'fuel':
            return <Fuel size={size} color={iconColor} />;
        case 'services':
            return <Smartphone size={size} color={iconColor} />;
        case 'home':
            return <Home size={size} color={iconColor} />;
        case 'health':
            return <BriefcaseMedical size={size} color={iconColor} />;
        case 'entertainment':
            return <Tv size={size} color={iconColor} />;
        case 'clothes':
            return <User size={size} color={iconColor} />;
        case 'education':
            return <GraduationCap size={size} color={iconColor} />;
        case 'shopping':
            return <ShoppingCart size={size} color={iconColor} />;
        case 'utilities':
            return <Zap size={size} color={iconColor} />;
        // Incomes
        case 'salary':
            return <Briefcase size={size} color={iconColor} />;
        case 'sales':
            return <Store size={size} color={iconColor} />;
        case 'freelance':
            return <Laptop size={size} color={iconColor} />;
        case 'transfer-in':
            return <ArrowLeftRight size={size} color={iconColor} />;
        case 'gift':
            return <Gift size={size} color={iconColor} />;
        case 'investment':
            return <TrendingUp size={size} color={iconColor} />;
        case 'remittance':
            return <FileText size={size} color={iconColor} />;
        // Both / Default
        case 'other':
            return <Circle size={size} color={iconColor} />;
        default:
            return <DollarSign size={size} color={iconColor} />;
    }
};

export default function TransactionItem({
    transaction,
    onPress,
    showDate = true
}: TransactionItemProps) {
    const category = DEFAULT_CATEGORIES.find(c => c.id === transaction.categoryId);

    const isIncome = transaction.type === 'income';
    const amountColor = isIncome ? Colors.status.income : Colors.status.expense;
    const amountPrefix = isIncome ? '+' : '-';

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hoy';
        if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
        return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: category?.color || Colors.background.tertiary }]}>
                <CategoryIcon categoryId={transaction.categoryId} />
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={styles.category} numberOfLines={1}>
                    {category?.name || 'Otro'}
                </Text>
                {transaction.description && (
                    <Text style={styles.description} numberOfLines={1}>
                        {transaction.description}
                    </Text>
                )}
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: amountColor }]}>
                    {amountPrefix}{formatUsd(transaction.amountUsd)}
                </Text>
                {showDate && (
                    <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
        marginRight: 12,
    },
    category: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    description: {
        fontSize: 13,
        color: Colors.text.muted,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
    },
    date: {
        fontSize: 12,
        color: Colors.text.muted,
        marginTop: 2,
    },
});
