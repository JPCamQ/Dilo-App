// Dilo App - Zustand Store (Fixed BCV with manual rate persistence)
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Account, AccountBalance, Category, DashboardStats, ParsedVoiceCommand, Transaction } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@react-native-google-signin/google-signin';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Centralized fallback rate - Update this when BCV rate changes significantly
const DEFAULT_BCV_FALLBACK_RATE = 301.37;

// ============================================
// Store Interface
// ============================================

interface AppStore {
    // Auth State
    isAuthenticated: boolean;
    isLocked: boolean;
    biometricEnabled: boolean;

    // Data
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];

    // BCV Rate - IMPROVED
    currentBcvRate: number;
    manualBcvRate: number;
    useManualRate: boolean;
    lastBcvUpdate: Date | null;

    // Voice State
    voiceCommand: ParsedVoiceCommand | null;
    isVoiceModalOpen: boolean;

    // UI State
    isLoading: boolean;
    error: string | null;

    // Voice Bank Keywords (editable)
    bankKeywords: Record<string, string[]>;

    // Cloud Backup
    googleUser: User | null;
    cloudSyncEnabled: boolean;
    lastCloudBackup: string | null;

    // Login Suggestion (Hybrid Mode)
    firstOpenDate: string | null;
    appLaunchCount: number;
    loginPromptDismissed: boolean;
    loginPromptShownCount: number;

    // Auth Actions
    setAuthenticated: (value: boolean) => void;
    setLocked: (value: boolean) => void;
    setBiometricEnabled: (value: boolean) => void;

    // Account Actions
    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    deleteAccount: (id: string) => void;
    updateAccountBalance: (id: string, amount: number) => void;

    // Transaction Actions
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    // Category Actions
    addCategory: (category: Category) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    // BCV Actions - IMPROVED
    setBcvRate: (rate: number) => void;
    setManualBcvRate: (rate: number) => void;
    setUseManualRate: (value: boolean) => void;
    getEffectiveBcvRate: () => number;

    // Voice Actions
    setVoiceCommand: (command: ParsedVoiceCommand | null) => void;
    setVoiceModalOpen: (open: boolean) => void;
    setBankKeywords: (keywords: Record<string, string[]>) => void;
    addBankKeyword: (bankName: string, keyword: string) => void;
    removeBankKeyword: (bankName: string, keyword: string) => void;

    // Cloud Backup Actions
    setGoogleUser: (user: User | null) => void;
    setCloudSyncEnabled: (enabled: boolean) => void;
    setLastCloudBackup: (timestamp: string | null) => void;

    // Login Suggestion Actions
    setFirstOpenDate: (date: string) => void;
    incrementAppLaunchCount: () => void;
    dismissLoginPrompt: () => void;
    shouldShowLoginPrompt: () => boolean;

    // Computed
    getTotalBalanceUsd: () => number;
    getTotalBalanceVes: () => number;
    getDashboardStats: () => DashboardStats;
    getAccountBalances: () => AccountBalance[];
    getRecentTransactions: (limit?: number) => Transaction[];
    getTodayTransactions: () => Transaction[];

    // Utility
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    resetStore: () => void;

    // Backup Restore (bulk setters)
    setAccounts: (accounts: Account[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setCategories: (categories: Category[]) => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
    isAuthenticated: false,
    isLocked: true,
    biometricEnabled: false,
    accounts: [],
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    currentBcvRate: 0,
    manualBcvRate: 0,
    useManualRate: false,
    lastBcvUpdate: null,
    voiceCommand: null,
    isVoiceModalOpen: false,
    isLoading: false,
    error: null,
    bankKeywords: {
        'efectivo': ['efectivo', 'cash', 'contado'],
        'banesco': ['banesco'],
        'mercantil': ['mercantil'],
        'provincial': ['provincial', 'bbva'],
        'venezuela': ['venezuela', 'bdv'],
        'binance': ['binance'],
        'paypal': ['paypal'],
        'zinli': ['zinli'],
        'zelle': ['zelle'],
    },
    googleUser: null,
    cloudSyncEnabled: false,
    lastCloudBackup: null,
    // Login Suggestion
    firstOpenDate: null,
    appLaunchCount: 0,
    loginPromptDismissed: false,
    loginPromptShownCount: 0,
};

// ============================================
// Store Implementation
// ============================================

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Auth Actions
            setAuthenticated: (value) => set({ isAuthenticated: value }),
            setLocked: (value) => set({ isLocked: value }),
            setBiometricEnabled: (value) => set({ biometricEnabled: value }),

            // Account Actions
            addAccount: (account) =>
                set((state) => ({ accounts: [...state.accounts, account] })),

            // Backup restore - bulk setter
            setAccounts: (accounts) => set({ accounts }),

            updateAccount: (id, updates) =>
                set((state) => ({
                    accounts: state.accounts.map((acc) =>
                        acc.id === id ? { ...acc, ...updates, updatedAt: new Date() } : acc
                    ),
                })),

            deleteAccount: (id) =>
                set((state) => ({
                    accounts: state.accounts.filter((acc) => acc.id !== id),
                })),

            updateAccountBalance: (id, amount) =>
                set((state) => ({
                    accounts: state.accounts.map((acc) =>
                        acc.id === id
                            ? { ...acc, balance: acc.balance + amount, updatedAt: new Date() }
                            : acc
                    ),
                })),

            // Transaction Actions - WITH CURRENCY CONVERSION
            addTransaction: (transaction) => {
                const { accounts, updateAccountBalance } = get();
                const account = accounts.find((a) => a.id === transaction.accountId);

                if (account) {
                    // Calculate the actual amount to add/subtract based on account currency
                    let balanceChangeInAccountCurrency: number;
                    const bcvRate = transaction.bcvRateUsed || DEFAULT_BCV_FALLBACK_RATE;

                    // Convert transaction amount to account's currency
                    if (account.currency === transaction.currencyOriginal) {
                        // Same currency - use original amount
                        balanceChangeInAccountCurrency = transaction.amountOriginal;
                    } else if (account.currency === 'VES') {
                        // Account is in VES, transaction might be in USD/USDT/USDC
                        // Convert to VES: amount * rate
                        balanceChangeInAccountCurrency = transaction.amountUsd * bcvRate;
                    } else if (account.currency === 'USD' || account.currency === 'USDT' || account.currency === 'USDC') {
                        // Account is in USD/USDT/USDC, transaction might be in VES
                        // Use amountUsd directly
                        balanceChangeInAccountCurrency = transaction.amountUsd;
                    } else {
                        // Fallback: use USD equivalent
                        balanceChangeInAccountCurrency = transaction.amountUsd;
                    }

                    // Apply income/expense sign
                    const finalChange = transaction.type === 'income'
                        ? balanceChangeInAccountCurrency
                        : -balanceChangeInAccountCurrency;

                    updateAccountBalance(transaction.accountId, finalChange);
                }

                set((state) => ({
                    transactions: [transaction, ...state.transactions],
                }));
            },

            // Backup restore - bulk setter
            setTransactions: (transactions) => set({ transactions }),

            updateTransaction: (id, updates) =>
                set((state) => ({
                    transactions: state.transactions.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),

            deleteTransaction: (id) => {
                const { transactions, accounts, updateAccountBalance } = get();
                const transaction = transactions.find((t) => t.id === id);

                if (transaction) {
                    const account = accounts.find((a) => a.id === transaction.accountId);

                    if (account) {
                        // Calculate the amount to reverse based on account currency
                        let balanceChangeInAccountCurrency: number;
                        const bcvRate = transaction.bcvRateUsed || DEFAULT_BCV_FALLBACK_RATE;

                        if (account.currency === transaction.currencyOriginal) {
                            balanceChangeInAccountCurrency = transaction.amountOriginal;
                        } else if (account.currency === 'VES') {
                            balanceChangeInAccountCurrency = transaction.amountUsd * bcvRate;
                        } else {
                            balanceChangeInAccountCurrency = transaction.amountUsd;
                        }

                        // Reverse the original operation
                        const finalChange = transaction.type === 'income'
                            ? -balanceChangeInAccountCurrency  // Was income, now remove
                            : balanceChangeInAccountCurrency;  // Was expense, now add back

                        updateAccountBalance(transaction.accountId, finalChange);
                    }
                }

                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                }));
            },

            // Category Actions
            addCategory: (category) =>
                set((state) => ({
                    categories: [...state.categories, category],
                })),

            // Backup restore - bulk setter
            setCategories: (categories) => set({ categories }),

            updateCategory: (id, updates) =>
                set((state) => ({
                    categories: state.categories.map((c) =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                })),

            deleteCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((c) => c.id !== id),
                })),

            // BCV Actions - IMPROVED
            setBcvRate: (rate) => {
                const { useManualRate } = get();
                // Only update API rate if NOT using manual
                if (!useManualRate) {
                    set({ currentBcvRate: rate, lastBcvUpdate: new Date() });
                }
            },

            setManualBcvRate: (rate) =>
                set({ manualBcvRate: rate, currentBcvRate: rate, lastBcvUpdate: new Date() }),

            setUseManualRate: (value) => {
                const { manualBcvRate, currentBcvRate } = get();
                if (value && manualBcvRate > 0) {
                    // Switch to manual: use manual rate
                    set({ useManualRate: value, currentBcvRate: manualBcvRate });
                } else {
                    set({ useManualRate: value });
                }
            },

            getEffectiveBcvRate: () => {
                const { useManualRate, manualBcvRate, currentBcvRate } = get();
                if (useManualRate && manualBcvRate > 0) {
                    return manualBcvRate;
                }
                return currentBcvRate > 0 ? currentBcvRate : DEFAULT_BCV_FALLBACK_RATE;
            },

            // Voice Actions
            setVoiceCommand: (command) => set({ voiceCommand: command }),
            setVoiceModalOpen: (open) => set({ isVoiceModalOpen: open }),

            setBankKeywords: (keywords) => set({ bankKeywords: keywords }),

            addBankKeyword: (bankName, keyword) => set((state) => {
                const existing = state.bankKeywords[bankName.toLowerCase()] || [];
                const lowerKeyword = keyword.toLowerCase().trim();
                if (existing.includes(lowerKeyword)) return state;
                return {
                    bankKeywords: {
                        ...state.bankKeywords,
                        [bankName.toLowerCase()]: [...existing, lowerKeyword]
                    }
                };
            }),

            removeBankKeyword: (bankName, keyword) => set((state) => {
                const existing = state.bankKeywords[bankName.toLowerCase()] || [];
                return {
                    bankKeywords: {
                        ...state.bankKeywords,
                        [bankName.toLowerCase()]: existing.filter(k => k !== keyword.toLowerCase())
                    }
                };
            }),

            // Cloud Backup Actions
            setGoogleUser: (user) => set({ googleUser: user }),
            setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),
            setLastCloudBackup: (lastCloudBackup) => set({ lastCloudBackup }),

            // Login Suggestion Actions
            setFirstOpenDate: (date) => set({ firstOpenDate: date }),
            incrementAppLaunchCount: () => set((state) => ({ appLaunchCount: state.appLaunchCount + 1 })),
            dismissLoginPrompt: () => set((state) => ({
                loginPromptDismissed: true,
                loginPromptShownCount: state.loginPromptShownCount + 1,
            })),
            shouldShowLoginPrompt: () => {
                const state = get();
                // Don't show if already logged in or dismissed
                if (state.googleUser || state.loginPromptDismissed) return false;
                // Don't show if shown 3+ times
                if (state.loginPromptShownCount >= 3) return false;

                // Show after 3 days of use
                if (state.firstOpenDate) {
                    const firstOpen = new Date(state.firstOpenDate);
                    const daysSinceOpen = Math.floor((Date.now() - firstOpen.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceOpen >= 3) return true;
                }

                // Show after 5 launches
                if (state.appLaunchCount >= 5) return true;

                // Show after 10 transactions
                if (state.transactions.length >= 10) return true;

                return false;
            },

            // Computed Values
            getTotalBalanceUsd: () => {
                const { accounts } = get();
                const rate = get().getEffectiveBcvRate();
                // Stablecoins treated as 1:1 with USD
                const stablecoins = ['USD', 'USDT', 'USDC'];

                return accounts.reduce((total, acc) => {
                    // USD and stablecoins: add directly
                    if (stablecoins.includes(acc.currency)) {
                        return total + acc.balance;
                    }
                    // VES: convert to USD using BCV rate
                    if (acc.currency === 'VES' && rate > 0) {
                        return total + (acc.balance / rate);
                    }
                    // Other cryptos (BTC, ETH, etc.): skip - no price available
                    return total;
                }, 0);
            },

            getTotalBalanceVes: () => {
                const { accounts } = get();
                const rate = get().getEffectiveBcvRate();
                return accounts.reduce((total, acc) => {
                    if (acc.currency === 'VES') return total + acc.balance;
                    if (acc.currency === 'USD') {
                        return total + (acc.balance * rate);
                    }
                    return total + (acc.balance * rate);
                }, 0);
            },

            getDashboardStats: () => {
                const { transactions } = get();
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

                const todayTxs = transactions.filter(
                    (t) => new Date(t.createdAt) >= today
                );
                const monthTxs = transactions.filter(
                    (t) => new Date(t.createdAt) >= monthStart
                );

                return {
                    totalBalanceUsd: get().getTotalBalanceUsd(),
                    totalBalanceVes: get().getTotalBalanceVes(),
                    todayIncome: todayTxs
                        .filter((t) => t.type === 'income')
                        .reduce((sum, t) => sum + t.amountUsd, 0),
                    todayExpense: todayTxs
                        .filter((t) => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amountUsd, 0),
                    monthIncome: monthTxs
                        .filter((t) => t.type === 'income')
                        .reduce((sum, t) => sum + t.amountUsd, 0),
                    monthExpense: monthTxs
                        .filter((t) => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amountUsd, 0),
                };
            },

            getAccountBalances: () => {
                const { accounts } = get();
                const rate = get().getEffectiveBcvRate();
                return accounts.map((account) => ({
                    account,
                    balanceUsd: account.currency === 'USD'
                        ? account.balance
                        : account.currency === 'VES' && rate > 0
                            ? account.balance / rate
                            : account.balance,
                    balanceVes: account.currency === 'VES'
                        ? account.balance
                        : account.balance * rate,
                }));
            },

            getRecentTransactions: (limit = 5) => {
                const { transactions } = get();
                return transactions
                    .sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .slice(0, limit);
            },

            getTodayTransactions: () => {
                const { transactions } = get();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return transactions.filter((t) => new Date(t.createdAt) >= today);
            },

            // Utility
            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),
            resetStore: () => set(initialState),
        }),
        {
            name: 'dilo-app-storage',
            version: 2, // Increment version to force migration
            storage: createJSONStorage(() => AsyncStorage),
            migrate: (persistedState: any, version) => {
                // Version 2: Force update categories to use Lucide icons
                if (version < 2) {
                    return {
                        ...persistedState,
                        categories: DEFAULT_CATEGORIES, // Replace old emoji categories
                    };
                }
                return persistedState;
            },
            partialize: (state) => ({
                accounts: state.accounts,
                transactions: state.transactions,
                categories: state.categories,
                bankKeywords: state.bankKeywords,
                // BCV Rate persistence - FIXED: now persists rates
                currentBcvRate: state.currentBcvRate,
                manualBcvRate: state.manualBcvRate,
                useManualRate: state.useManualRate,
                lastBcvUpdate: state.lastBcvUpdate,
                biometricEnabled: state.biometricEnabled,
                // Persist Login Suggestion Data
                firstOpenDate: state.firstOpenDate,
                appLaunchCount: state.appLaunchCount,
                loginPromptDismissed: state.loginPromptDismissed,
                loginPromptShownCount: state.loginPromptShownCount,
            }),
        }
    )
);
