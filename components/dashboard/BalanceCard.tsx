// Dilo App - Balance Card Component
// Muestra el saldo total consolidado en USD y VES

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, RefreshCw } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { fetchBcvRate, formatUsd, formatVes } from '@/services/bcv';
import { Colors } from '@/constants/Colors';

export default function BalanceCard() {
    const {
        getTotalBalanceUsd,
        getTotalBalanceVes,
        currentBcvRate,
        setBcvRate,
        lastBcvUpdate
    } = useAppStore();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const totalUsd = getTotalBalanceUsd();
    const totalVes = getTotalBalanceVes();

    // Fetch BCV rate on mount
    useEffect(() => {
        const loadRate = async () => {
            try {
                const rate = await fetchBcvRate();
                setBcvRate(rate);
            } catch (error) {
                console.error('Error loading BCV rate:', error);
            }
        };

        if (!currentBcvRate) {
            loadRate();
        }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const rate = await fetchBcvRate();
            setBcvRate(rate);
        } catch (error) {
            console.error('Error refreshing BCV rate:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background.secondary, Colors.background.tertiary]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.label}>💰 SALDO TOTAL</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {isRefreshing ? (
                            <ActivityIndicator size="small" color={Colors.accent.emerald} />
                        ) : (
                            <RefreshCw
                                size={18}
                                color={Colors.text.secondary}
                                onPress={handleRefresh}
                            />
                        )}
                    </View>
                </View>

                {/* Main Balance USD */}
                <Text style={styles.balanceUsd}>
                    {formatUsd(totalUsd)}
                </Text>

                {/* Balance VES */}
                <Text style={styles.balanceVes}>
                    Bs. {formatVes(totalVes)}
                </Text>

                {/* BCV Rate */}
                <View style={styles.rateContainer}>
                    <TrendingUp size={14} color={Colors.accent.emerald} />
                    <Text style={styles.rateText}>
                        Tasa BCV: Bs. {currentBcvRate?.toFixed(2) || '---'}
                    </Text>
                    {lastBcvUpdate && (
                        <Text style={styles.rateDate}>
                            {new Date(lastBcvUpdate).toLocaleDateString('es-VE')}
                        </Text>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
        // Glassmorphism shadow
        shadowColor: Colors.accent.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    gradient: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRight: {
        padding: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
        letterSpacing: 1,
    },
    balanceUsd: {
        fontSize: 36,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    balanceVes: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.text.secondary,
        marginBottom: 16,
    },
    rateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },
    rateText: {
        fontSize: 13,
        color: Colors.accent.emerald,
        fontWeight: '500',
    },
    rateDate: {
        fontSize: 11,
        color: Colors.text.muted,
        marginLeft: 'auto',
    },
});
