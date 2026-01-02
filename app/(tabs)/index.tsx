// Dilo App - Dashboard Screen (Clean UI with Transaction Management)
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText, Plus, Search, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AccountCard from '@/components/dashboard/AccountCard';
import EditTransactionModal from '@/components/transactions/EditTransactionModal';
import TransactionItem from '@/components/transactions/TransactionItem';
import MultiVoiceConfirmation from '@/components/voice/MultiVoiceConfirmation';
import VoiceConfirmation from '@/components/voice/VoiceConfirmation';
import VoiceListeningModal from '@/components/voice/VoiceListeningModal';
import { Colors } from '@/constants/Colors';
import { fetchBcvRate, formatUsd, formatVes } from '@/services/bcv';
import { AI_MODELS, convertToAppTransactions, isOpenRouterConfigured, parseVoiceWithAI } from '@/services/openRouterService';
import { useAppStore } from '@/stores/useAppStore';
import { ParsedVoiceCommand, Transaction } from '@/types';
import { parseMultipleTransactions, setAccountKeywords } from '@/utils/voiceParser';

export default function DashboardScreen() {
  const {
    accounts,
    getRecentTransactions,
    getTotalBalanceUsd,
    getTotalBalanceVes,
    getDashboardStats,
    setBcvRate,
    addTransaction,
    deleteTransaction,
    getTodayTransactions,
    getEffectiveBcvRate,
    useManualRate,
    lastBcvUpdate,
    bankKeywords,
    categories,
    googleUser,
    isVoiceModalOpen,
    setVoiceModalOpen,
    shouldShowLoginPrompt
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
  const [showMultiVoiceConfirmation, setShowMultiVoiceConfirmation] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [parsedCommands, setParsedCommands] = useState<ParsedVoiceCommand[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Transaction management
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [todayFilter, setTodayFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const params = useLocalSearchParams();
  const recentTransactions = getRecentTransactions(5);
  const todayTransactions = getTodayTransactions();
  const totalUsd = getTotalBalanceUsd();
  const totalVes = getTotalBalanceVes();
  const stats = getDashboardStats();
  const bcvRate = getEffectiveBcvRate();

  const [activeTab, setActiveTab] = useState<'hoy' | 'todo'>('hoy');

  useEffect(() => { loadBcvRate(); }, []);

  // Sync bank keywords to voice parser
  useEffect(() => {
    if (bankKeywords && Object.keys(bankKeywords).length > 0) {
      setAccountKeywords(bankKeywords);
    }
  }, [bankKeywords]);

  const loadBcvRate = async () => {
    if (useManualRate) return;
    try {
      const rate = await fetchBcvRate();
      setBcvRate(rate);
    } catch (error) {
      console.error('BCV Error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBcvRate();
    setIsRefreshing(false);
  };

  // Voice Recognition - Enhanced with AI and Local Fallback
  const handleVoiceResult = async (text: string) => {
    setVoiceModalOpen(false);
    setIsProcessingVoice(true);
    console.log('🎤 Processing voice command:', text);

    let parsedResults: ParsedVoiceCommand[] = [];

    // Try AI first if configured
    const useAI = await isOpenRouterConfigured();

    if (useAI) {
      console.log('🤖 Using AI for parsing...');
      const aiResult = await parseVoiceWithAI(text, AI_MODELS.DEEPSEEK_R1); // Default to R1 (fast & free)

      if (aiResult.success && aiResult.transactions.length > 0) {
        parsedResults = convertToAppTransactions(aiResult.transactions, categories, bankKeywords);
        console.log('✅ AI Success:', parsedResults.length, 'transactions');
      } else {
        console.log('⚠️ AI Parsing failed or returned empty, falling back to local');
      }
    }

    // Fallback to local parser if AI failed or not configured
    if (parsedResults.length === 0) {
      console.log('🧠 Using local parser fallback');
      parsedResults = parseMultipleTransactions(text, categories, bankKeywords);
    }

    setIsProcessingVoice(false);

    if (parsedResults.length > 1) {
      // Multiple transactions detected
      setParsedCommands(parsedResults);
      setShowMultiVoiceConfirmation(true);
    } else if (parsedResults.length === 1) {
      // Single transaction
      setParsedCommand(parsedResults[0]);
      setShowVoiceConfirmation(true);
    } else {
      // Could not parse - show helpful error
      Alert.alert(
        'Comando no reconocido',
        `No pude entender: "${text}"\n\nIntenta decir:\n• "Gasté 20 en café"\n• "Pagué 50 de luz"\n• "Recibí 100 de salario"`,
        [
          { text: 'Reintentar', onPress: () => setVoiceModalOpen(true) },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleConfirmTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transaction: Transaction = { ...transactionData, id: Date.now().toString(), createdAt: new Date() };
    addTransaction(transaction);
    setShowVoiceConfirmation(false);
    setParsedCommand(null);
    Alert.alert('✓ Registrado', `${transaction.type === 'income' ? 'Ingreso' : 'Gasto'} de ${formatUsd(transaction.amountUsd)} guardado`);
  };

  const handleConfirmMultipleTransactions = (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    transactions.forEach((transactionData, index) => {
      const transaction: Transaction = {
        ...transactionData,
        id: (Date.now() + index).toString(),
        createdAt: new Date()
      };
      addTransaction(transaction);
    });
    setShowMultiVoiceConfirmation(false);
    setParsedCommands([]);
    Alert.alert('✓ Registradas', `${transactions.length} transacciones guardadas`);
  };

  const handleRemoveMultiItem = (index: number) => {
    setParsedCommands(prev => prev.filter((_, i) => i !== index));
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string, amount: number) => {
    Alert.alert(
      'Eliminar transacción',
      `¿Eliminar ${formatUsd(amount)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            // Close modal if no more transactions
            const remaining = todayTransactions.filter(t => t.id !== id);
            if (remaining.length === 0) setShowTodayModal(false);
          }
        }
      ]
    );
  };

  const filteredTodayTransactions = todayTransactions.filter(t =>
    todayFilter === 'all' || t.type === todayFilter
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

      {/* FIXED TOP SECTION */}
      <View style={styles.fixedTop}>
        {/* LUXURY Header */}
        <View style={styles.header}>
          {googleUser?.user ? (
            // Logged in - Show user info
            <View style={styles.headerInfo}>
              {googleUser.user.photo ? (
                <Image
                  source={{ uri: googleUser.user.photo }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '700' }}>
                    {googleUser.user.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.headerUser}>Hola,</Text>
                <Text style={styles.headerName}>{googleUser.user.name}</Text>
              </View>
            </View>
          ) : (
            // Not logged in - Simple welcome message
            <View style={styles.headerInfo}>
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: 20 }}>👋</Text>
              </View>
              <View>
                <Text style={styles.headerUser}>Bienvenido a</Text>
                <Text style={styles.headerName}>Dilo</Text>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/settings')}>
            <Search size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1, width: '80%', alignSelf: 'center', marginTop: 12, marginBottom: 24 }}
        />

        {/* MASSIVE Clean Balance Panel (Left Aligned, Stacked) */}
        <View style={styles.mainBalanceContainer}>
          <Text style={styles.mainBalanceTitle}>BALANCE TOTAL</Text>
          <Text
            style={styles.mainBalanceValue}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatUsd(totalUsd)}
          </Text>
          <View style={styles.balanceDetailsRow}>
            <Text style={styles.rateText}>1$ = {bcvRate.toFixed(2)}</Text>
            <Text style={styles.detailsSeparator}>•</Text>
            <Text style={styles.vesText}>Bs. {formatVes(totalVes)}</Text>
          </View>
        </View>

        {/* SIDE-BY-SIDE Premium Stats Cards */}
        <View style={styles.dualCardsRow}>
          <TouchableOpacity style={styles.entryCardWrapper} onPress={() => router.push('/transactions?filter=income')}>
            <LinearGradient
              colors={['#151C3B', '#0B1026']}
              style={[styles.entryCardGradient, { borderLeftWidth: 3, borderLeftColor: Colors.status.income }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.entryHeader}>
                <View style={[styles.incomeIconBox, { shadowColor: Colors.status.income, shadowRadius: 8, shadowOpacity: 0.4 }]}>
                  <TrendingUp size={20} color="#FFF" />
                </View>
                <Text style={styles.entryTitle}>Ingresos</Text>
              </View>
              <Text style={[styles.entryValue, { color: Colors.status.income }]}>
                {formatUsd(stats.todayIncome)}
              </Text>
              <Text style={styles.entrySub}>Bs. {formatVes(stats.todayIncome * bcvRate)}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.entryCardWrapper} onPress={() => router.push('/transactions?filter=expense')}>
            <LinearGradient
              colors={['#151C3B', '#0B1026']}
              style={[styles.entryCardGradient, { borderLeftWidth: 3, borderLeftColor: Colors.status.expense }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.entryHeader}>
                <View style={[styles.expenseIconBox, { shadowColor: Colors.status.expense, shadowRadius: 8, shadowOpacity: 0.4 }]}>
                  <TrendingDown size={20} color="#FFF" />
                </View>
                <Text style={styles.entryTitle}>Gastos</Text>
              </View>
              <Text style={[styles.entryValue, { color: Colors.status.expense }]}>
                {formatUsd(stats.todayExpense)}
              </Text>
              <Text style={styles.entrySub}>Bs. {formatVes(stats.todayExpense * bcvRate)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent.primary} colors={[Colors.accent.primary]} />}
      >

        {/* TODAY TRANSACTIONS Section */}
        <View style={styles.modularSection}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={[styles.sectionHeader, { paddingHorizontal: 0 }]}>
            <Text style={styles.sectionTitle}>Movimientos de Hoy</Text>
          </View>

          <View style={styles.modularList}>
            {todayTransactions.length > 0 ? (
              todayTransactions.slice(0, 5).map(t => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onPress={() => setEditingTransaction(t)}
                />
              ))
            ) : (
              <View style={styles.emptyModular}>
                <FileText size={32} color={Colors.text.muted} opacity={0.3} />
                <Text style={styles.emptyModularText}>Sin movimientos hoy</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/transactions')}
            >
              <Text style={styles.viewAllText}>Ver todas las transacciones</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNTS Quick Access */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cuentas</Text>
            <TouchableOpacity onPress={() => router.push('/accounts')}>
              <Plus size={20} color={Colors.accent.primary} />
            </TouchableOpacity>
          </View>
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onPress={() => router.push('/accounts')}
            />
          ))}
        </View>


        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Slide Menu removed */}

      {/* Voice Listening Modal (Global) */}
      <VoiceListeningModal
        visible={isVoiceModalOpen}
        onResult={handleVoiceResult}
        onCancel={() => setVoiceModalOpen(false)}
      />

      {/* Voice Confirmation Modal */}
      <VoiceConfirmation
        visible={showVoiceConfirmation}
        command={parsedCommand}
        onConfirm={handleConfirmTransaction}
        onCancel={() => { setShowVoiceConfirmation(false); setParsedCommand(null); }}
        onRetry={() => { setShowVoiceConfirmation(false); setParsedCommand(null); setVoiceModalOpen(true); }}
      />

      {/* Multi Voice Confirmation Modal */}
      <MultiVoiceConfirmation
        visible={showMultiVoiceConfirmation}
        commands={parsedCommands}
        onConfirmAll={handleConfirmMultipleTransactions}
        onCancel={() => { setShowMultiVoiceConfirmation(false); setParsedCommands([]); }}
        onRemoveItem={handleRemoveMultiItem}
      />

      {/* Today Transactions Modal - Edit/Delete */}
      <Modal visible={showTodayModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.todayModal}>
            <View style={styles.todayHeader}>
              <View style={styles.todayTitleRow}>
                {todayFilter === 'expense' ? (
                  <TrendingDown size={20} color={Colors.status.expense} />
                ) : todayFilter === 'income' ? (
                  <TrendingUp size={20} color={Colors.status.income} />
                ) : (
                  <FileText size={20} color={Colors.text.secondary} />
                )}
                <Text style={styles.todayTitle}>
                  {todayFilter === 'income' ? 'Ingresos de hoy' : todayFilter === 'expense' ? 'Gastos de hoy' : 'Transacciones de hoy'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTodayModal(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              {(['all', 'income', 'expense'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterBtn, todayFilter === filter && styles.filterBtnActive]}
                  onPress={() => setTodayFilter(filter)}
                >
                  <Text style={[styles.filterBtnText, todayFilter === filter && styles.filterBtnTextActive]}>
                    {filter === 'all' ? 'Todo' : filter === 'income' ? 'Ingresos' : 'Gastos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.todayList} showsVerticalScrollIndicator={false}>
              {filteredTodayTransactions.length > 0 ? (
                filteredTodayTransactions.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.todayItem}
                    onPress={() => setEditingTransaction(t)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.todayItemIcon,
                      { backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                    ]}>
                      {t.type === 'income' ? (
                        <TrendingUp size={18} color={Colors.status.income} />
                      ) : (
                        <TrendingDown size={18} color={Colors.status.expense} />
                      )}
                    </View>
                    <View style={styles.todayItemInfo}>
                      <Text style={[
                        styles.todayItemAmount,
                        { color: t.type === 'income' ? Colors.status.income : Colors.status.expense }
                      ]}>
                        {t.type === 'income' ? '+' : '-'}{formatUsd(t.amountUsd)}
                      </Text>
                      <Text style={styles.todayItemCategory}>{t.description || 'Sin descripción'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteTransaction(t.id, t.amountUsd)}
                    >
                      <Trash2 size={18} color={Colors.status.expense} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyModal}>
                  <Text style={styles.emptyModalText}>
                    {todayFilter === 'income' ? 'Sin ingresos hoy' : todayFilter === 'expense' ? 'Sin gastos hoy' : 'Sin transacciones hoy'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={editingTransaction !== null}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* AI Processing Overlay */}
      <Modal transparent visible={isProcessingVoice} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={{ backgroundColor: Colors.background.secondary, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.premium.glassBorder }}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={{ marginTop: 16, color: Colors.text.primary, fontSize: 16, fontWeight: '600' }}>Analizando...</Text>
            <Text style={{ marginTop: 8, color: Colors.text.muted, fontSize: 13 }}>Usando IA para entenderte mejor</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  fixedTop: {
    backgroundColor: Colors.background.primary,
    zIndex: 10,
  },
  scrollContent: { flex: 1 },

  // Header Luxury
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0, // Removed padding to bring line closer
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.premium.glassBorder,
  },
  photoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.premium.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUser: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '500'
  },
  headerName: {
    fontSize: 20,
    color: Colors.text.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  linkAccountBadge: {
    backgroundColor: Colors.accent.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '40',
    marginLeft: 8,
  },
  linkAccountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.premium.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.premium.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Main Balance Panel
  mainBalanceContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 20,
    alignItems: 'flex-start', // LEFT ALIGNED
  },
  spotlight: {
    position: 'absolute',
    top: -50,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.premium.spotlight,
    opacity: 0.6,
    transform: [{ scaleX: 2 }],
  },
  mainBalanceTitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
  },
  mainBalanceValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -2,
    includeFontPadding: false,
    textShadowColor: 'rgba(14, 165, 233, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-condensed' : undefined,
    marginBottom: 8,
  },
  balanceDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsSeparator: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '400',
  },
  rateText: {
    fontSize: 15,
    color: Colors.accent.primary,
    fontWeight: '700',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
  },
  vesText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : undefined,
  },
  // Dual Cards Row
  dualCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  entryCardWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  entryCardGradient: {
    padding: 16,
    height: 130,
    justifyContent: 'flex-start', // Stack from top
    alignItems: 'flex-start', // LEFT ALIGNED
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  entryHeader: {
    flexDirection: 'row', // Icon + Title horizontal
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  incomeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 14,
    color: '#FFF', // White text
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  entryValue: {
    fontWeight: '800',
  },
  entrySub: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 6,
    fontWeight: '500',
  },

  // Modular Tabs Section
  modularSection: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    minHeight: 400,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modularTabs: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modularTab: {
    paddingBottom: 12,
  },
  modularTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent.primary,
  },
  modularTabText: {
    fontSize: 15,
    color: Colors.text.muted,
    fontWeight: '600',
  },
  modularTabTextActive: {
    color: Colors.text.primary,
  },
  modularList: {
    gap: 4,
  },
  emptyModular: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyModularText: {
    color: Colors.text.muted,
    marginTop: 12,
    fontSize: 14,
  },

  // Sections Legacy
  section: { marginTop: 24, paddingHorizontal: 0 },
  accountListContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  todayModal: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  closeBtn: { padding: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
  },
  filterBtnActive: {
    backgroundColor: Colors.accent.primary,
  },
  filterBtnText: { fontSize: 13, color: Colors.text.muted, fontWeight: '500' },
  filterBtnTextActive: { color: '#FFF' },
  todayList: { flex: 1, minHeight: 150 },
  todayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.background.secondary,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  todayItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayItemInfo: { flex: 1 },
  todayItemAmount: { fontSize: 18, fontWeight: '700' },
  todayItemCategory: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyModal: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyModalText: {
    fontSize: 15,
    color: Colors.text.muted,
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
});
