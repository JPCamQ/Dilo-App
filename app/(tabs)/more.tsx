import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import {
    ChevronRight,
    CreditCard,
    History,
    Mic,
    PieChart,
    Settings,
    Tag
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MENU_ITEMS = [
    {
        title: 'Cuentas',
        subtitle: 'Gestiona tus bancos y efectivo',
        icon: <CreditCard size={22} color={Colors.accent.primary} />,
        route: '/accounts'
    },
    {
        title: 'Categorías',
        subtitle: 'Personaliza tus consumos',
        icon: <Tag size={22} color="#F43F5E" />,
        route: '/categories'
    },
    {
        title: 'Historial',
        subtitle: 'Todas tus transacciones',
        icon: <History size={22} color="#8B5CF6" />,
        route: '/transactions'
    },
    {
        title: 'Reportes',
        subtitle: 'Análisis detallado de gastos',
        icon: <PieChart size={22} color="#10B981" />,
        route: '/reports'
    },
    {
        title: 'Palabras Clave',
        subtitle: 'Configura detección de voz',
        icon: <Mic size={22} color="#F59E0B" />,
        route: '/voice-keywords'
    },
    {
        title: 'Ajustes',
        subtitle: 'Biometría, Tasa y más',
        icon: <Settings size={22} color={Colors.text.muted} />,
        route: '/settings'
    },
];

export default function MoreScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Funciones</Text>
                <Text style={styles.headerSubtitle}>Personaliza tu experiencia</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.grid}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuCard}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.iconBox}>
                                {item.icon}
                            </View>
                            <View style={styles.textBox}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                            </View>
                            <ChevronRight size={18} color={Colors.border.default} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Section */}
                <View style={styles.footerInfo}>
                    <Text style={styles.versionText}>Dilo App v1.1.2 - Premium Edition</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.text.muted,
        marginTop: 4,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    grid: {
        gap: 12,
    },
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textBox: {
        flex: 1,
        marginLeft: 16,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    itemSubtitle: {
        fontSize: 13,
        color: Colors.text.muted,
        marginTop: 2,
    },
    footerInfo: {
        marginTop: 32,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: Colors.text.muted,
        opacity: 0.5,
    }
});
