// Dilo App - Supabase Client & Configuration
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Environment Configuration
// ============================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ============================================
// Supabase Client Initialization
// ============================================

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    // Return null if not configured
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.log('⚠️ Supabase not configured - cloud sync disabled');
        return null;
    }

    // Create client if not exists
    if (!supabaseClient) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                storage: AsyncStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
        console.log('✅ Supabase client initialized');
    }

    return supabaseClient;
}

// ============================================
// Connection Health Check
// ============================================

export async function checkSupabaseConnection(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
        // Simple health check - try to get server time
        const { error } = await client.from('_health_check').select('*').limit(1);

        // Table might not exist, but if we get a response, connection works
        if (error && error.code !== 'PGRST116') {
            console.warn('⚠️ Supabase connection check failed:', error.message);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Supabase connection error:', error);
        return false;
    }
}

// ============================================
// Check if Supabase is configured
// ============================================

export function isSupabaseConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ============================================
// Database Types (for future use with Supabase)
// ============================================

export interface DbAccount {
    id: string;
    user_id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
}

export interface DbTransaction {
    id: string;
    user_id: string;
    account_id: string;
    category_id: string;
    type: string;
    amount_original: number;
    currency_original: string;
    amount_usd: number;
    amount_ves: number;
    bcv_rate_used: number;
    description: string;
    voice_raw?: string;
    created_at: string;
}

export interface DbCategory {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    type: string;
    is_visible: boolean;
    color: string;
}

// ============================================
// Export
// ============================================

export const SupabaseService = {
    getClient: getSupabaseClient,
    checkConnection: checkSupabaseConnection,
    isConfigured: isSupabaseConfigured,
};

export default SupabaseService;
