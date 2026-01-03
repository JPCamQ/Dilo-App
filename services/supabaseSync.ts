// Dilo App - Supabase Cloud Sync Service
import { Account, Category, Transaction } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// ============================================
// Types
// ============================================

export interface SyncResult {
    success: boolean;
    message: string;
    syncedAt?: Date;
    accountsSynced?: number;
    transactionsSynced?: number;
    categoriesSynced?: number;
}

export interface CloudData {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    lastSync: string;
}

// ============================================
// Sync to Cloud (Upload)
// ============================================

export async function syncToCloud(
    userId: string,
    accounts: Account[],
    transactions: Transaction[],
    categories: Category[]
): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
        return {
            success: false,
            message: 'Supabase no está configurado',
        };
    }

    const client = getSupabaseClient();
    if (!client) {
        return {
            success: false,
            message: 'No se pudo conectar a Supabase',
        };
    }

    try {
        console.log('☁️ Starting cloud sync...');

        // Upsert accounts
        const { error: accountsError } = await client
            .from('accounts')
            .upsert(
                accounts.map(a => ({
                    id: a.id,
                    user_id: userId,
                    name: a.name,
                    type: a.type,
                    currency: a.currency,
                    balance: a.balance,
                    icon: a.icon,
                    color: a.color,
                    created_at: a.createdAt,
                    updated_at: a.updatedAt,
                })),
                { onConflict: 'id' }
            );

        if (accountsError) throw accountsError;

        // Upsert transactions
        const { error: txError } = await client
            .from('transactions')
            .upsert(
                transactions.map(t => ({
                    id: t.id,
                    user_id: userId,
                    account_id: t.accountId,
                    category_id: t.categoryId,
                    type: t.type,
                    amount_original: t.amountOriginal,
                    currency_original: t.currencyOriginal,
                    amount_usd: t.amountUsd,
                    amount_ves: t.amountVes,
                    bcv_rate_used: t.bcvRateUsed,
                    description: t.description,
                    voice_raw: t.voiceRaw,
                    created_at: t.createdAt,
                })),
                { onConflict: 'id' }
            );

        if (txError) throw txError;

        // Upsert categories
        const { error: catError } = await client
            .from('categories')
            .upsert(
                categories.map(c => ({
                    id: c.id,
                    user_id: userId,
                    name: c.name,
                    icon: c.icon,
                    type: c.type,
                    is_visible: c.isVisible,
                    color: c.color,
                })),
                { onConflict: 'id' }
            );

        if (catError) throw catError;

        const syncedAt = new Date();
        console.log('✅ Cloud sync completed');

        return {
            success: true,
            message: 'Sincronización completada',
            syncedAt,
            accountsSynced: accounts.length,
            transactionsSynced: transactions.length,
            categoriesSynced: categories.length,
        };
    } catch (error: any) {
        console.error('❌ Cloud sync failed:', error);
        return {
            success: false,
            message: error.message || 'Error de sincronización',
        };
    }
}

// ============================================
// Sync from Cloud (Download)
// ============================================

export async function syncFromCloud(userId: string): Promise<CloudData | null> {
    if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured');
        return null;
    }

    const client = getSupabaseClient();
    if (!client) return null;

    try {
        console.log('☁️ Fetching data from cloud...');

        // Fetch accounts
        const { data: accountsData, error: accountsError } = await client
            .from('accounts')
            .select('*')
            .eq('user_id', userId);

        if (accountsError) throw accountsError;

        // Fetch transactions
        const { data: txData, error: txError } = await client
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (txError) throw txError;

        // Fetch categories
        const { data: catData, error: catError } = await client
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        if (catError) throw catError;

        // Transform to app types
        const accounts: Account[] = (accountsData || []).map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            currency: a.currency,
            balance: a.balance,
            icon: a.icon,
            color: a.color,
            createdAt: new Date(a.created_at),
            updatedAt: new Date(a.updated_at),
        }));

        const transactions: Transaction[] = (txData || []).map(t => ({
            id: t.id,
            accountId: t.account_id,
            categoryId: t.category_id,
            type: t.type,
            amountOriginal: t.amount_original,
            currencyOriginal: t.currency_original,
            amountUsd: t.amount_usd,
            amountVes: t.amount_ves,
            bcvRateUsed: t.bcv_rate_used,
            description: t.description,
            voiceRaw: t.voice_raw,
            createdAt: new Date(t.created_at),
        }));

        const categories: Category[] = (catData || []).map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            type: c.type,
            isVisible: c.is_visible,
            color: c.color,
        }));

        console.log(`✅ Fetched: ${accounts.length} accounts, ${transactions.length} transactions, ${categories.length} categories`);

        return {
            accounts,
            transactions,
            categories,
            lastSync: new Date().toISOString(),
        };
    } catch (error: any) {
        console.error('❌ Cloud fetch failed:', error);
        return null;
    }
}

// ============================================
// Delete from Cloud
// ============================================

export async function deleteFromCloud(
    table: 'accounts' | 'transactions' | 'categories',
    id: string
): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
        const { error } = await client.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete ${table}/${id}:`, error);
        return false;
    }
}

// ============================================
// Export Service
// ============================================

export const CloudSyncService = {
    syncToCloud,
    syncFromCloud,
    deleteFromCloud,
};

export default CloudSyncService;
