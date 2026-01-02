// Dilo App - Voice Command Parser (Fixed for large numbers)
// Interpreta comandos de voz en español para registrar transacciones

import { CATEGORY_KEYWORDS } from '@/constants/categories';
import { Currency, ParsedVoiceCommand, TransactionType } from '@/types';

// Palabras clave para detectar tipo de transacción
const EXPENSE_KEYWORDS = [
    'gaste', 'gasté', 'gastado', 'pague', 'pagué', 'compre', 'compré',
    'gasto', 'pago', 'compra', 'costo', 'costó'
];

const INCOME_KEYWORDS = [
    'ingreso', 'ingresé', 'recibí', 'recibi', 'cobré', 'cobre', 'gané', 'gane',
    'venta', 'vendí', 'vendi', 'me pagaron', 'deposito', 'depósito'
];

// Palabras clave para monedas
const CURRENCY_PATTERNS: { pattern: RegExp; currency: Currency }[] = [
    { pattern: /d[oó]lar(es)?/i, currency: 'USD' },
    { pattern: /\busd\b/i, currency: 'USD' },
    { pattern: /bol[ií]var(es)?/i, currency: 'VES' },
    { pattern: /\bbs\.?\b/i, currency: 'VES' },
    { pattern: /\bves\b/i, currency: 'VES' },
    { pattern: /\busdt\b|tether/i, currency: 'USDT' },
    { pattern: /\busdc\b/i, currency: 'USDC' },
];

// Palabras clave para cuentas comunes (mutable - se actualiza desde el store)
let ACCOUNT_KEYWORDS: Record<string, string[]> = {
    'efectivo': ['efectivo', 'cash', 'contado'],
    'banesco': ['banesco'],
    'mercantil': ['mercantil'],
    'provincial': ['provincial', 'bbva'],
    'venezuela': ['venezuela', 'bdv'],
    'binance': ['binance'],
    'paypal': ['paypal'],
    'zinli': ['zinli'],
    'zelle': ['zelle'],
};

// Función para actualizar keywords desde el store (legacy support)
export function setAccountKeywords(keywords: Record<string, string[]>) {
    ACCOUNT_KEYWORDS = keywords;
}

// Convertir palabras numéricas a números
const WORD_NUMBERS: Record<string, number> = {
    'mil': 1000,
    'diez mil': 10000,
    'veinte mil': 20000,
    'treinta mil': 30000,
    'cuarenta mil': 40000,
    'cincuenta mil': 50000,
    'cien mil': 100000,
    'un millón': 1000000,
    'millón': 1000000,
};

/**
 * Extrae el monto numérico de un texto - MEJORADO para números grandes
 */
function extractAmount(text: string): number | null {
    const lowerText = text.toLowerCase();

    // 1. Buscar patrones con separadores de miles (10,000 o 10.000 o 10 000)
    const largeNumberPatterns = [
        // Formato: 10,000 bolívares / 10.000 dólares
        /(\d{1,3}(?:[,.\s]\d{3})+)(?:\s*(?:d[oó]lar|usd|bol[ií]var|bs|mil))?/i,
        // Formato: 10000 (sin separadores)
        /(\d{4,})(?:\s*(?:d[oó]lar|usd|bol[ií]var|bs))?/i,
    ];

    for (const pattern of largeNumberPatterns) {
        const match = lowerText.match(pattern);
        if (match) {
            // Remover separadores de miles (coma, espacio, punto cuando es separador)
            let numStr = match[1].replace(/[\s,]/g, '');
            // Si tiene punto y más de 3 dígitos después, es decimal; si no, es separador de miles
            if (numStr.includes('.')) {
                const parts = numStr.split('.');
                if (parts[1] && parts[1].length === 3 && parts.length > 2) {
                    // Es separador de miles (10.000.000)
                    numStr = numStr.replace(/\./g, '');
                }
                // Si solo tiene un punto y 3 dígitos después, probablemente es miles
                else if (parts[1] && parts[1].length === 3 && parts.length === 2) {
                    numStr = numStr.replace(/\./g, '');
                }
            }
            const num = parseFloat(numStr);
            if (!isNaN(num) && num > 0) {
                return num;
            }
        }
    }

    // 2. Buscar palabras como "diez mil", "cincuenta mil"
    for (const [word, value] of Object.entries(WORD_NUMBERS)) {
        if (lowerText.includes(word)) {
            return value;
        }
    }

    // 3. Buscar números simples con decimales
    const simplePattern = /(\d+(?:[.,]\d{1,2})?)(?:\s*(?:d[oó]lar|usd|bol[ií]var|bs))?/i;
    const match = lowerText.match(simplePattern);
    if (match) {
        const numStr = match[1].replace(',', '.');
        const num = parseFloat(numStr);
        if (!isNaN(num) && num > 0) {
            return num;
        }
    }

    return null;
}

/**
 * Detecta el tipo de transacción (ingreso/gasto)
 */
function detectTransactionType(text: string): TransactionType {
    const lowerText = text.toLowerCase();

    for (const keyword of INCOME_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            return 'income';
        }
    }

    return 'expense';
}

/**
 * Detecta la moneda del comando
 */
function detectCurrency(text: string): Currency {
    for (const { pattern, currency } of CURRENCY_PATTERNS) {
        if (pattern.test(text)) {
            return currency;
        }
    }
    return 'USD';
}

/**
 * Detecta la categoría del comando - Dinámico y Case-Insensitive
 */
function detectCategory(text: string, customCategories?: any[]): string | undefined {
    const lowerText = text.toLowerCase();

    // 1. Probar con palabras clave estáticas (mapeo rápido)
    for (const [keyword, categoryId] of Object.entries(CATEGORY_KEYWORDS)) {
        if (lowerText.includes(keyword)) {
            return categoryId;
        }
    }

    // 2. Probar con las categorías dinámicas del Store (por nombre)
    if (customCategories) {
        for (const cat of customCategories) {
            const catName = cat.name.toLowerCase();
            // Buscar coincidencia exacta o contenida (ej: "ropa" en "comprar ropa")
            if (lowerText.includes(catName)) {
                return cat.id;
            }
        }
    }

    return undefined;
}

/**
 * Detecta la cuenta del comando
 */
function detectAccount(text: string, customKeywords?: Record<string, string[]>): string | undefined {
    const lowerText = text.toLowerCase();
    const keywordsToUse = customKeywords || ACCOUNT_KEYWORDS;

    for (const [accountName, keywords] of Object.entries(keywordsToUse)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return accountName;
            }
        }
    }

    return undefined;
}

/**
 * Parser principal de comandos de voz
 */
export function parseVoiceCommand(
    rawText: string,
    categories?: any[],
    bankKeywords?: Record<string, string[]>
): ParsedVoiceCommand | null {
    if (!rawText || rawText.trim().length < 3) {
        return null;
    }

    const text = rawText.trim();

    // Extraer monto
    const amount = extractAmount(text);
    if (!amount) {
        return null;
    }

    // Detectar componentes
    const type = detectTransactionType(text);
    const currency = detectCurrency(text);
    const category = detectCategory(text, categories);
    const account = detectAccount(text, bankKeywords);

    // Calcular confianza
    let confidence = 0.5;
    if (amount) confidence += 0.2;
    if (category) confidence += 0.15;
    if (account) confidence += 0.15;

    return {
        type,
        amount,
        currency,
        category,
        account,
        description: undefined,
        rawText: text,
        confidence: Math.min(confidence, 1),
    };
}

/**
 * Parsea múltiples transacciones de un solo comando de voz
 */
export function parseMultipleTransactions(
    rawText: string,
    categories?: any[],
    bankKeywords?: Record<string, string[]>
): ParsedVoiceCommand[] {
    if (!rawText || rawText.trim().length < 3) {
        return [];
    }

    const text = rawText.trim();

    // Dividir por "y" o comas, pero preservar el contexto
    // Patrones de separación: " y ", ", y ", ","
    const segments = text
        .split(/\s+y\s+|,\s*y\s+|,\s*/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    if (segments.length === 0) {
        return [];
    }

    const results: ParsedVoiceCommand[] = [];
    let defaultType: TransactionType = 'expense';
    let defaultCurrency: Currency = 'USD';
    // NO heredamos cuenta - cada transacción detecta la suya

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Para el primer segmento, parsear completo
        if (i === 0) {
            const parsed = parseVoiceCommand(segment, categories, bankKeywords);
            if (parsed) {
                results.push(parsed);
                // Guardar contexto de tipo y moneda (NO cuenta)
                defaultType = parsed.type;
                defaultCurrency = parsed.currency;
            }
        } else {
            // Para siguientes segmentos, intentar parsear
            let parsed = parseVoiceCommand(segment, categories, bankKeywords);

            if (parsed) {
                // Heredar SOLO tipo y moneda si no están explícitos
                if (!detectTransactionTypeExplicit(segment)) {
                    parsed.type = defaultType;
                }
                if (!detectCurrencyExplicit(segment)) {
                    parsed.currency = defaultCurrency;
                }
                // La cuenta ya fue detectada en parseVoiceCommand
                results.push(parsed);
            } else {
                // Intentar parsear solo con número, categoría y cuenta
                const amount = extractAmount(segment);
                if (amount) {
                    const category = detectCategory(segment, categories);
                    const account = detectAccount(segment, bankKeywords); // Detectar cuenta de este segmento
                    results.push({
                        type: defaultType,
                        amount,
                        currency: defaultCurrency,
                        category,
                        account, // Cuenta específica de este segmento
                        description: undefined,
                        rawText: segment,
                        confidence: 0.6,
                    });
                }
            }
        }
    }

    return results;
}

// Funciones auxiliares para detectar si el tipo/moneda está explícito en el texto
function detectTransactionTypeExplicit(text: string): boolean {
    const lowerText = text.toLowerCase();
    const allKeywords = [...EXPENSE_KEYWORDS, ...INCOME_KEYWORDS];
    return allKeywords.some(kw => lowerText.includes(kw));
}

function detectCurrencyExplicit(text: string): boolean {
    return CURRENCY_PATTERNS.some(({ pattern }) => pattern.test(text));
}

/**
 * Formatea un comando parseado para mostrar al usuario
 */
export function formatParsedCommand(cmd: ParsedVoiceCommand): string {
    const typeStr = cmd.type === 'income' ? '💰 Ingreso' : '💸 Gasto';
    const categoryStr = cmd.category ? ` en ${cmd.category}` : '';
    const accountStr = cmd.account ? ` desde ${cmd.account}` : '';

    return `${typeStr} de ${cmd.amount} ${cmd.currency}${categoryStr}${accountStr}`;
}

export default {
    parseVoiceCommand,
    parseMultipleTransactions,
    formatParsedCommand,
};
