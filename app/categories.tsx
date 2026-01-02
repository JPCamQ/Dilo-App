import CategoryIcon, { AVAILABLE_ICONS } from '@/components/ui/CategoryIcon';
import { Colors } from '@/constants/Colors';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { useAppStore } from '@/stores/useAppStore';
import { Category, CategoryType } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Check, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'expense' | 'income';

export default function CategoriesScreen() {
    const { categories, addCategory, updateCategory, deleteCategory } = useAppStore();
    const [activeTab, setActiveTab] = useState<TabType>('income');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formIcon, setFormIcon] = useState('circle');
    const [formType, setFormType] = useState<CategoryType>('expense');

    // Use store categories if available, otherwise default
    const allCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

    const filteredCategories = allCategories.filter(
        c => c.type === activeTab || c.type === 'both'
    );

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setFormName('');
        setFormIcon('circle');
        setFormType(activeTab);
        setShowModal(true);
    };

    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category);
        setFormName(category.name);
        setFormIcon(category.icon);
        setFormType(category.type);
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formName.trim()) {
            Alert.alert('Error', 'El nombre es requerido');
            return;
        }

        const color = formType === 'expense' ? '#EF4444' : Colors.accent.primary;

        if (editingCategory) {
            // Update existing
            updateCategory(editingCategory.id, {
                name: formName.trim(),
                icon: formIcon,
                type: formType,
                color,
            });
            Alert.alert('✓ Actualizado', 'Categoría actualizada');
        } else {
            // Create new
            const newCategory: Category = {
                id: `custom-${Date.now()}`,
                name: formName.trim(),
                icon: formIcon,
                type: formType,
                isVisible: true,
                color,
            };
            addCategory(newCategory);
            Alert.alert('✓ Creada', 'Nueva categoría creada');
        }

        setShowModal(false);
    };

    const handleDelete = () => {
        if (!editingCategory) return;

        Alert.alert(
            'Eliminar categoría',
            `¿Eliminar "${editingCategory.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        deleteCategory(editingCategory.id);
                        setShowModal(false);
                    }
                }
            ]
        );
    };

    const iconColor = activeTab === 'expense' ? Colors.status.expense : Colors.status.income;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Categorías</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'income' && styles.tabActiveIncome]}
                    onPress={() => setActiveTab('income')}
                >
                    <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
                        INGRESOS
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'expense' && styles.tabActiveExpense]}
                    onPress={() => setActiveTab('expense')}
                >
                    <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
                        GASTOS
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Categories Grid */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {filteredCategories.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={styles.categoryCard}
                            onPress={() => handleOpenEdit(category)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconBox,
                                { backgroundColor: `${iconColor}20` }
                            ]}>
                                <CategoryIcon
                                    iconName={category.icon}
                                    size={26}
                                    color={iconColor}
                                />
                            </View>
                            <Text style={styles.categoryName} numberOfLines={1}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Button */}
            <TouchableOpacity onPress={handleOpenCreate} activeOpacity={0.8} style={styles.addButtonContainer}>
                <LinearGradient
                    colors={Colors.premium.actionGradient}
                    style={styles.addButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Plus size={22} color="#FFF" />
                    <Text style={styles.addButtonText}>Nueva Categoría</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Edit/Create Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X size={24} color={Colors.text.secondary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </Text>
                            {editingCategory && (
                                <TouchableOpacity onPress={handleDelete}>
                                    <Text style={styles.deleteText}>Eliminar</Text>
                                </TouchableOpacity>
                            )}
                            {!editingCategory && <View style={{ width: 60 }} />}
                        </View>

                        {/* Name Input */}
                        <Text style={styles.inputLabel}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            value={formName}
                            onChangeText={setFormName}
                            placeholder="Nombre de la categoría"
                            placeholderTextColor={Colors.text.muted}
                        />

                        {/* Type Selector */}
                        <Text style={styles.inputLabel}>Tipo</Text>
                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[styles.typeBtn, formType === 'expense' && styles.typeBtnExpense]}
                                onPress={() => setFormType('expense')}
                            >
                                <Text style={[styles.typeBtnText, formType === 'expense' && styles.typeBtnTextActive]}>
                                    Gasto
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, formType === 'income' && styles.typeBtnIncome]}
                                onPress={() => setFormType('income')}
                            >
                                <Text style={[styles.typeBtnText, formType === 'income' && styles.typeBtnTextActive]}>
                                    Ingreso
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Icon Picker */}
                        <Text style={styles.inputLabel}>Icono</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
                            {AVAILABLE_ICONS.map(icon => (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconOption,
                                        formIcon === icon && {
                                            backgroundColor: formType === 'expense' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                                            borderColor: formType === 'expense' ? '#F43F5E' : '#0EA5E9',
                                        }
                                    ]}
                                    onPress={() => setFormIcon(icon)}
                                >
                                    <CategoryIcon
                                        iconName={icon}
                                        size={22}
                                        color={formType === 'expense' ? '#F43F5E' : '#0EA5E9'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Save Button */}
                        <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
                            <LinearGradient
                                colors={formType === 'expense' ? ['#F43F5E', '#9F1239'] : Colors.premium.actionGradient}
                                style={styles.saveBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Check size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>
                                    {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background.primary },
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
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActiveExpense: { borderBottomColor: Colors.status.expense },
    tabActiveIncome: { borderBottomColor: Colors.status.income },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.muted,
        letterSpacing: 0.5,
    },
    tabTextActive: { color: Colors.text.primary },
    content: { flex: 1, padding: 16 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    addButtonContainer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        // Premium Shadow
        shadowColor: Colors.premium.actionShadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    deleteText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.status.expense,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: Colors.background.tertiary,
        borderRadius: 18,
        padding: 14,
        fontSize: 16,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    typeRow: { flexDirection: 'row', gap: 12 },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: Colors.background.tertiary,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    typeBtnExpense: {
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        borderColor: '#F43F5E',
    },
    typeBtnIncome: {
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        borderColor: '#0EA5E9',
    },
    typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text.muted },
    typeBtnTextActive: { color: Colors.text.primary },
    iconPicker: { marginTop: 8 },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 28,
        // Premium Shadow
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
