// Dilo App - Export Modal Component
// Modal to select export format and period

import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/Colors';
import { exportTransactions, filterByDateRange } from '@/services/exportService';
import { useAppStore } from '@/stores/useAppStore';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ExportModalProps {
    visible: boolean;
    onClose: () => void;
}

type PeriodType = 'week' | 'month' | 'year' | 'all';
type FormatType = 'html' | 'csv' | 'pdf';

const PERIODS: { key: PeriodType; label: string }[] = [
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'year', label: 'Este año' },
    { key: 'all', label: 'Todo' },
];

const FORMATS: { key: FormatType; label: string; icon: React.ElementType; description: string }[] = [
    { key: 'html', label: 'HTML Pro', icon: FileText, description: 'Reporte visual profesional' },
    { key: 'csv', label: 'Excel', icon: FileSpreadsheet, description: 'Tabla CSV' },
    { key: 'pdf', label: 'Texto', icon: FileText, description: 'Resumen TXT' },
];

export default function ExportModal({ visible, onClose }: ExportModalProps) {
    const { transactions, accounts, categories: storeCategories } = useAppStore();
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
    const [selectedFormat, setSelectedFormat] = useState<FormatType>('html');
    const [isExporting, setIsExporting] = useState(false);

    const categories = storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES;

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const filteredTransactions = filterByDateRange(transactions, selectedPeriod);

            if (filteredTransactions.length === 0) {
                Alert.alert('Sin datos', 'No hay transacciones en el período seleccionado');
                setIsExporting(false);
                return;
            }

            const success = await exportTransactions({
                transactions: filteredTransactions,
                accounts,
                categories,
                format: selectedFormat,
            });

            if (success) {
                onClose();
            } else {
                Alert.alert('Error', 'No se pudo exportar. Intenta de nuevo.');
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Ocurrió un error al exportar');
        }

        setIsExporting(false);
    };

    const filteredCount = filterByDateRange(transactions, selectedPeriod).length;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={22} color={Colors.text.secondary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitle}>
                            <Download size={20} color={Colors.accent.emerald} />
                            <Text style={styles.title}>Exportar Datos</Text>
                        </View>
                        <View style={{ width: 38 }} />
                    </View>

                    {/* Period Selection */}
                    <Text style={styles.sectionLabel}>Período</Text>
                    <View style={styles.periodRow}>
                        {PERIODS.map(period => (
                            <TouchableOpacity
                                key={period.key}
                                style={[
                                    styles.periodBtn,
                                    selectedPeriod === period.key && styles.periodBtnActive
                                ]}
                                onPress={() => setSelectedPeriod(period.key)}
                            >
                                <Text style={[
                                    styles.periodText,
                                    selectedPeriod === period.key && styles.periodTextActive
                                ]}>
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.countText}>
                        {filteredCount} transacciones
                    </Text>

                    {/* Format Selection */}
                    <Text style={styles.sectionLabel}>Formato</Text>
                    <View style={styles.formatContainer}>
                        {FORMATS.map(format => {
                            const Icon = format.icon;
                            const isSelected = selectedFormat === format.key;
                            return (
                                <TouchableOpacity
                                    key={format.key}
                                    style={[
                                        styles.formatCard,
                                        isSelected && styles.formatCardActive
                                    ]}
                                    onPress={() => setSelectedFormat(format.key)}
                                >
                                    <View style={[
                                        styles.formatIcon,
                                        isSelected && styles.formatIconActive
                                    ]}>
                                        <Icon size={24} color={isSelected ? '#FFF' : Colors.accent.primary} />
                                    </View>
                                    <Text style={[
                                        styles.formatLabel,
                                        isSelected && styles.formatLabelActive
                                    ]}>
                                        {format.label}
                                    </Text>
                                    <Text style={styles.formatDesc}>{format.description}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Export Button */}
                    <TouchableOpacity
                        style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
                        onPress={handleExport}
                        disabled={isExporting || filteredCount === 0}
                    >
                        {isExporting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Download size={20} color="#FFF" />
                                <Text style={styles.exportBtnText}>Descargar y Guardar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
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
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    closeBtn: { padding: 8 },
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

    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: 10,
        marginTop: 8,
    },

    periodRow: {
        flexDirection: 'row',
        gap: 8,
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: Colors.background.tertiary,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    periodBtnActive: {
        backgroundColor: Colors.accent.primary,
        borderColor: Colors.accent.primary,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.muted,
    },
    periodTextActive: {
        color: '#FFF',
    },
    countText: {
        fontSize: 12,
        color: Colors.text.muted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 8,
    },

    formatContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    formatCard: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        backgroundColor: Colors.background.tertiary,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border.default,
    },
    formatCardActive: {
        borderColor: Colors.accent.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    formatIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    formatIconActive: {
        backgroundColor: Colors.accent.primary,
    },
    formatLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    formatLabelActive: {
        color: Colors.accent.primary,
    },
    formatDesc: {
        fontSize: 11,
        color: Colors.text.muted,
        textAlign: 'center',
    },

    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.accent.primary,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 24,
    },
    exportBtnDisabled: {
        opacity: 0.6,
    },
    exportBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
