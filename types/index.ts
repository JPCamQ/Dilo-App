// Dilo App - TypeScript Type Definitions

// ============================================
// Enums
// ============================================
export type AccountType = 'bank' | 'cash' | 'crypto' | 'digital';
export type Currency = 'VES' | 'USD' | 'BTC' | 'ETH' | 'USDT' | 'USDC';
export type TransactionType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense' | 'both';

// ============================================
// Core Models
// ============================================

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    currency: Currency;
    balance: number;
    icon: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id: string;
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amountOriginal: number;
    currencyOriginal: Currency;
    amountUsd: number;
    amountVes: number;
    bcvRateUsed: number;
    description: string;
    voiceRaw?: string;
    createdAt: Date;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    type: CategoryType;
    isVisible: boolean;
    color: string;
}

export interface ExchangeRate {
    id: string;
    rate: number;
    source: 'bcv' | 'manual';
    fetchedAt: Date;
}

// ============================================
// Voice Command Types
// ============================================

export interface ParsedVoiceCommand {
    type: TransactionType;
    amount: number;
    currency: Currency;
    category?: string;
    account?: string;
    description?: string;
    rawText: string;
    confidence: number;
}

export interface VoiceState {
    isListening: boolean;
    isProcessing: boolean;
    transcript: string;
    parsedCommand: ParsedVoiceCommand | null;
    error: string | null;
}

// ============================================
// App State Types
// ============================================

export interface AppState {
    // Auth
    isAuthenticated: boolean;
    isLocked: boolean;

    // Data
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];

    // BCV
    currentBcvRate: number;
    lastBcvUpdate: Date | null;

    // UI
    isLoading: boolean;
    error: string | null;
}

// ============================================
// API Response Types
// ============================================

export interface BcvApiResponse {
    dollar: number;
    date: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
    totalBalanceUsd: number;
    totalBalanceVes: number;
    todayIncome: number;
    todayExpense: number;
    monthIncome: number;
    monthExpense: number;
}

export interface AccountBalance {
    account: Account;
    balanceUsd: number;
    balanceVes: number;
}
