// Dilo App - Account Card (Horizontal Row Style with Flag as Icon)
// Full width horizontal layout with flag/crypto symbol as primary visual

import { Colors } from '@/constants/Colors';
import { formatUsd, formatVes } from '@/services/bcv';
import { useAppStore } from '@/stores/useAppStore';
import { Account } from '@/types';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AccountCardProps {
    account: Account;
    onPress?: () => void;
}

// Currency to Flag/Symbol mapping (used as primary icon)
const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        'VES': '🇻🇪',
        'USD': '🇺🇸',
        'USDT': '🇺🇸',
        'USDC': '🇺🇸',
        'BTC': '₿',
        'ETH': 'Ξ',
    };
    return symbols[currency] || '💰';
};

export default function AccountCard({ account, onPress }: AccountCardProps) {
    const { currentBcvRate } = useAppStore();

    const balanceDisplay = () => {
        if (account.currency === 'USD') {
            return formatUsd(account.balance);
        } else if (account.currency === 'VES') {
            return `Bs. ${formatVes(account.balance)}`;
        } else {
            return `${account.balance.toFixed(2)} ${account.currency}`;
        }
    };

    const equivalentDisplay = () => {
        const stablecoins = ['USD', 'USDT', 'USDC'];
        if (stablecoins.includes(account.currency) && currentBcvRate > 0) {
            return `Bs. ${formatVes(account.balance * currentBcvRate)}`;
        } else if (account.currency === 'VES' && currentBcvRate > 0) {
            return `≈ ${formatUsd(account.balance / currentBcvRate)}`;
        }
        return null;
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Left: Flag/Symbol as Icon */}
            <View style={styles.flagContainer}>
                <Text style={styles.flagText}>{getCurrencySymbol(account.currency)}</Text>
            </View>

            {/* Center: Name + Equivalent */}
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{account.name}</Text>
                {equivalentDisplay() && (
                    <Text style={styles.equivalent}>{equivalentDisplay()}</Text>
                )}
            </View>

            {/* Right: Balance + Chevron */}
            <View style={styles.balanceContainer}>
                <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
                    {balanceDisplay()}
                </Text>
                <ChevronRight size={18} color={Colors.text.muted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border.default,
        marginBottom: 12,
        marginHorizontal: 24,
    },
    flagContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    flagText: {
        fontSize: 24,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    equivalent: {
        fontSize: 13,
        color: Colors.text.muted,
        marginTop: 2,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    balance: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
});
