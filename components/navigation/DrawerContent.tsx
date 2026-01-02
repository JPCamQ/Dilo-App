// Dilo App - Custom Drawer Content
// Menú lateral premium

import { Colors } from '@/constants/Colors';
import { formatUsd } from '@/services/bcv';
import { useAppStore } from '@/stores/useAppStore';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { router } from 'expo-router';
import {
    BarChart3,
    History,
    Home,
    Settings,
    TrendingUp,
    Wallet,
    X
} from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    route: string;
}

export default function DrawerContent(props: any) {
    const { getTotalBalanceUsd, currentBcvRate } = useAppStore();
    const totalBalance = getTotalBalanceUsd();

    const menuItems: MenuItem[] = [
        { icon: <Home size={22} color={Colors.text.primary} />, label: 'Inicio', route: '/(tabs)' },
        { icon: <History size={22} color={Colors.text.primary} />, label: 'Historial', route: '/(tabs)/transactions' },
        { icon: <Wallet size={22} color={Colors.text.primary} />, label: 'Cuentas', route: '/(tabs)/accounts' },
        { icon: <BarChart3 size={22} color={Colors.text.primary} />, label: 'Reportes', route: '/(tabs)/reports' },
    ];

    const handleNavigation = (route: string) => {
        props.navigation.closeDrawer();
        router.push(route as any);
    };

    return (
        <View style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => props.navigation.closeDrawer()}>
                <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>

            {/* Header with Logo */}
            <View style={styles.header}>
                <Image
                    source={require('@/assets/images/DiloApp.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.appName}>Dilo</Text>
                <Text style={styles.tagline}>Gestión Financiera Inteligente</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>SALDO TOTAL</Text>
                <Text style={styles.balanceAmount}>{formatUsd(totalBalance)}</Text>
                <View style={styles.rateRow}>
                    <TrendingUp size={14} color={Colors.accent.emerald} />
                    <Text style={styles.rateText}>BCV: Bs. {currentBcvRate.toFixed(2)}</Text>
                </View>
            </View>

            {/* Menu Items */}
            <DrawerContentScrollView {...props} contentContainerStyle={styles.menuScroll}>
                <View style={styles.menuSection}>
                    <Text style={styles.menuLabel}>MENÚ</Text>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => handleNavigation(item.route)}
                        >
                            {item.icon}
                            <Text style={styles.menuItemText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.footerItem}>
                    <Settings size={20} color={Colors.text.muted} />
                    <Text style={styles.footerText}>Configuración</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    logoImage: {
        width: 72,
        height: 72,
        borderRadius: 16,
        marginBottom: 12,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text.primary,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 13,
        color: Colors.text.muted,
        marginTop: 4,
    },
    balanceCard: {
        margin: 20,
        padding: 20,
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    balanceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.muted,
        letterSpacing: 1,
        marginBottom: 6,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rateText: {
        fontSize: 13,
        color: Colors.accent.emerald,
        fontWeight: '500',
    },
    menuScroll: {
        paddingHorizontal: 16,
    },
    menuSection: {
        marginTop: 8,
    },
    menuLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.muted,
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
    },
    footerText: {
        fontSize: 15,
        color: Colors.text.muted,
    },
});
