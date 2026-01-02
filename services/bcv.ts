// Dilo App - BCV API Service (Multi-source with fallbacks)
import axios from 'axios';

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

// Updated fallback rate (Dec 30, 2024 - BCV Official is ~301.37)
const FALLBACK_RATE = 301.37;

let cachedRate: number | null = null;
let lastFetchTime: Date | null = null;
let lastSuccessfulSource: string | null = null;
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function fetchBcvRate(): Promise<number> {
    // Check cache first
    if (cachedRate && lastFetchTime) {
        const timeSinceLastFetch = Date.now() - lastFetchTime.getTime();
        if (timeSinceLastFetch < CACHE_DURATION_MS) {
            console.log(`📦 Using cached rate: ${cachedRate} (from ${lastSuccessfulSource})`);
            return cachedRate;
        }
    }

    // Try each API source
    for (const source of API_SOURCES) {
        try {
            console.log(`🔄 Trying ${source.name}...`);

            const response = await axios.get(source.url, {
                timeout: 15000, // 15s timeout for slower connections
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log(`📥 ${source.name} response:`, JSON.stringify(response.data).substring(0, 200));

            const rate = source.parser(response.data);

            if (typeof rate === 'number' && rate > 0 && rate < 10000) {
                cachedRate = rate;
                lastFetchTime = new Date();
                lastSuccessfulSource = source.name;
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

    // All APIs failed - use cache if available
    if (cachedRate && cachedRate > 0) {
        console.log(`📦 All APIs failed, using cached rate: ${cachedRate}`);
        return cachedRate;
    }

    // Last resort - fallback rate
    console.log(`⚠️ All APIs failed, using fallback: ${FALLBACK_RATE}`);
    cachedRate = FALLBACK_RATE;
    lastFetchTime = new Date();
    lastSuccessfulSource = 'Fallback';
    return FALLBACK_RATE;
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

export function clearRateCache(): void {
    cachedRate = null;
    lastFetchTime = null;
    lastSuccessfulSource = null;
}

export function getLastSource(): string | null {
    return lastSuccessfulSource;
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
};

export default BcvService;
