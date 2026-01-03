// Dilo App - BCV API Service (Multi-source with persistent offline cache)
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ============================================
// Cache Configuration
// ============================================
const CACHE_KEY = 'bcv_rate_cache';
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface CachedRate {
    rate: number;
    timestamp: number;
    source: string;
}

// Helper to parse rate that might be string with comma or number
const parseRate = (value: any): number | null => {
    if (typeof value === 'number' && value > 0) return value;
    if (typeof value === 'string') {
        // Handle European format (comma as decimal separator)
        const cleaned = value.replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
};

// Multiple API sources for redundancy
const API_SOURCES = [
    {
        name: 'BCV-Rafnixg',
        url: 'https://bcv-api.rafnixg.dev/rates',
        parser: (data: any) => parseRate(data?.dollar),
    },
    {
        name: 'PyDolarVe',
        url: 'https://pydolarve.org/api/v2/dollar?monitor=bcv',
        parser: (data: any) => parseRate(data?.monitors?.bcv?.price),
    },
    {
        name: 'ExchangeMonitor',
        url: 'https://exchangemonitor.net/api/dolar/bcv',
        parser: (data: any) => parseRate(data?.price),
    },
];

// Updated fallback rate (Jan 2, 2026 - BCV Official ~301.37)
const FALLBACK_RATE = 301.37;

// In-memory cache (faster than AsyncStorage for frequent reads)
let memoryCache: CachedRate | null = null;

// ============================================
// Persistent Cache Functions
// ============================================

async function loadCacheFromStorage(): Promise<CachedRate | null> {
    try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as CachedRate;
            memoryCache = parsed;
            return parsed;
        }
    } catch (error) {
        console.warn('⚠️ Failed to load BCV cache from storage:', error);
    }
    return null;
}

async function saveCacheToStorage(cache: CachedRate): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        memoryCache = cache;
    } catch (error) {
        console.warn('⚠️ Failed to save BCV cache to storage:', error);
    }
}

function isCacheValid(cache: CachedRate | null): boolean {
    if (!cache) return false;
    const age = Date.now() - cache.timestamp;
    return age < CACHE_DURATION_MS && cache.rate > 0;
}

// ============================================
// Main Fetch Function with Offline Support
// ============================================

export async function fetchBcvRate(): Promise<number> {
    // 1. Load persistent cache if memory is empty
    if (!memoryCache) {
        await loadCacheFromStorage();
    }

    // 2. Return valid cache immediately (fresh data)
    if (memoryCache && isCacheValid(memoryCache)) {
        console.log(`📦 Using cached rate: ${memoryCache.rate} (from ${memoryCache.source})`);
        return memoryCache.rate;
    }

    // 3. Try network fetch from multiple sources
    for (const source of API_SOURCES) {
        try {
            console.log(`🔄 Trying ${source.name}...`);

            const response = await axios.get(source.url, {
                timeout: 15000, // 15s timeout for slower connections
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36',
                    'Cache-Control': 'no-cache'
                }
            });

            const rate = source.parser(response.data);

            if (typeof rate === 'number' && rate > 0 && rate < 10000) {
                const newCache: CachedRate = {
                    rate,
                    timestamp: Date.now(),
                    source: source.name,
                };
                await saveCacheToStorage(newCache);
                console.log(`✅ BCV Rate from ${source.name}: Bs. ${rate}`);
                return rate;
            } else {
                console.warn(`⚠️ ${source.name} returned invalid rate:`, rate);
            }
        } catch (error: any) {
            console.warn(`⚠️ ${source.name} failed:`, error.message);
            continue; // Try next source
        }
    }

    // 4. All APIs failed - use expired cache if available (offline mode)
    if (memoryCache && memoryCache.rate > 0) {
        console.log(`📴 OFFLINE: Using expired cached rate: ${memoryCache.rate} (from ${memoryCache.source})`);
        return memoryCache.rate;
    }

    // 5. Load from storage as last attempt
    const storedCache = await loadCacheFromStorage();
    if (storedCache && storedCache.rate > 0) {
        console.log(`📴 OFFLINE: Using stored rate: ${storedCache.rate}`);
        return storedCache.rate;
    }

    // 6. Last resort - hardcoded fallback
    console.log(`⚠️ All sources failed, using fallback: ${FALLBACK_RATE}`);
    const fallbackCache: CachedRate = {
        rate: FALLBACK_RATE,
        timestamp: Date.now(),
        source: 'Fallback',
    };
    await saveCacheToStorage(fallbackCache);
    return FALLBACK_RATE;
}

// ============================================
// Check if currently using cached/offline rate
// ============================================

export function isUsingCachedRate(): boolean {
    if (!memoryCache) return false;
    return !isCacheValid(memoryCache);
}

export function getCacheInfo(): { source: string; age: string; isOffline: boolean } | null {
    if (!memoryCache) return null;
    const ageMs = Date.now() - memoryCache.timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);

    let ageString: string;
    if (ageHours > 0) {
        ageString = `${ageHours}h ${ageMinutes % 60}m`;
    } else {
        ageString = `${ageMinutes}m`;
    }

    return {
        source: memoryCache.source,
        age: ageString,
        isOffline: !isCacheValid(memoryCache),
    };
}

export function usdToVes(usd: number, rate: number): number {
    if (rate <= 0) return 0;
    return usd * rate;
}

export function vesToUsd(ves: number, rate: number): number {
    if (rate <= 0) return 0;
    return ves / rate;
}

export function formatVes(amount: number): string {
    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatUsd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function isRateFresh(lastUpdate: Date | null): boolean {
    if (!lastUpdate) return false;
    const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
    return timeSinceUpdate < CACHE_DURATION_MS;
}

export async function clearRateCache(): Promise<void> {
    memoryCache = null;
    try {
        await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.warn('⚠️ Failed to clear BCV cache:', error);
    }
}

export function getLastSource(): string | null {
    return memoryCache?.source ?? null;
}

export const BcvService = {
    fetchRate: fetchBcvRate,
    usdToVes,
    vesToUsd,
    formatVes,
    formatUsd,
    isRateFresh,
    clearCache: clearRateCache,
    getLastSource,
    isUsingCachedRate,
    getCacheInfo,
};

export default BcvService;

