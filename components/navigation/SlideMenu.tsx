// Dilo App - Slide Menu (Premium Professional Design)
import { Colors } from '@/constants/Colors';
import { formatUsd, formatVes } from '@/services/bcv';
import { useAppStore } from '@/stores/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BarChart3, ChevronRight, History, Home, Settings, Tag, TrendingUp, Wallet, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.85;

interface MenuItem { icon: React.ElementType; label: string; route: string; description: string; }

export default function SlideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { getTotalBalanceUsd, getTotalBalanceVes, currentBcvRate } = useAppStore();

    const totalUsd = getTotalBalanceUsd();
    const totalVes = getTotalBalanceVes();

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: visible ? 0 : -MENU_WIDTH, duration: visible ? 300 : 250, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: visible ? 1 : 0, duration: visible ? 300 : 250, useNativeDriver: true }),
        ]).start();
    }, [visible]);

    const menuItems: MenuItem[] = [
        { icon: Home, label: 'Inicio', route: '/(tabs)', description: 'Panel principal' },
        { icon: History, label: 'Historial', route: '/(tabs)/transactions', description: 'Transacciones' },
        { icon: Wallet, label: 'Cuentas', route: '/(tabs)/accounts', description: 'Gestionar cuentas' },
        { icon: Tag, label: 'Categorías', route: '/categories', description: 'Organizar gastos' },
        { icon: BarChart3, label: 'Reportes', route: '/(tabs)/reports', description: 'Estadísticas' },
    ];

    const handleNavigation = (route: string) => {
        onClose();
        // Use replace for instant navigation without animation
        setTimeout(() => router.replace(route as any), 100);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
                    {/* Header with Logo */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('@/assets/images/icon.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={20} color={Colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Balance Card */}
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceTop}>
                            <Text style={styles.balanceLabel}>SALDO TOTAL</Text>
                            <View style={styles.rateChip}>
                                <TrendingUp size={10} color={Colors.accent.emerald} />
                                <Text style={styles.rateText}>{currentBcvRate.toFixed(2)}</Text>
                            </View>
                        </View>
                        <Text style={styles.balanceUsd}>{formatUsd(totalUsd)}</Text>
                        <Text style={styles.balanceVes}>Bs. {formatVes(totalVes)}</Text>
                    </LinearGradient>

                    {/* Navigation Menu */}
                    <View style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>NAVEGACIÓN</Text>
                        {menuItems.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.menuItem}
                                onPress={() => handleNavigation(item.route)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuIconContainer}>
                                    <item.icon size={20} color={Colors.accent.emerald} strokeWidth={1.8} />
                                </View>
                                <View style={styles.menuTextContainer}>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                    <Text style={styles.menuDescription}>{item.description}</Text>
                                </View>
                                <ChevronRight size={18} color={Colors.text.muted} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            activeOpacity={0.7}
                            onPress={() => handleNavigation('/(tabs)/settings')}
                        >
                            <Settings size={18} color={Colors.text.muted} strokeWidth={1.5} />
                            <Text style={styles.settingsText}>Configuración</Text>
                            <ChevronRight size={16} color={Colors.text.muted} />
                        </TouchableOpacity>

                        <View style={styles.versionContainer}>
                            <Text style={styles.version}>Dilo App</Text>
                            <Text style={styles.versionNumber}>v1.0.0</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    menu: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: MENU_WIDTH,
        backgroundColor: Colors.background.primary,
        borderRightWidth: 1,
        borderRightColor: Colors.border.default,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    logoContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: Colors.background.secondary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    logo: { width: '100%', height: '100%' },
    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },

    // Balance Card
    balanceCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    balanceTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    balanceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.muted,
        letterSpacing: 1.2
    },
    rateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 8
    },
    rateText: { fontSize: 11, fontWeight: '700', color: Colors.accent.emerald },
    balanceUsd: { fontSize: 26, fontWeight: '800', color: Colors.text.primary, letterSpacing: -1 },
    balanceVes: { fontSize: 13, color: Colors.text.secondary, marginTop: 2, fontWeight: '500' },

    // Menu Section
    menuSection: { flex: 1, paddingTop: 10, paddingHorizontal: 16 },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.muted,
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    menuIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    menuTextContainer: { flex: 1 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
    menuDescription: { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

    // Footer
    footer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border.default,
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    settingsText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text.secondary },
    versionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    version: { fontSize: 12, color: Colors.text.muted, fontWeight: '500' },
    versionNumber: { fontSize: 12, color: Colors.text.muted, opacity: 0.6 },
});
