// OpenRouter AI Service for Voice Parsing
// Uses free AI models: Gemini 2.0, DeepSeek R1, Meta Llama

import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY_STORAGE_KEY = 'openrouter_api_key';

// Free models available on OpenRouter (updated Jan 2025)
export const AI_MODELS = {
    GEMINI_2_FLASH: 'google/gemini-2.0-flash-exp:free',  // Newest, fastest TTFT
    DEEPSEEK_R1: 'deepseek/deepseek-r1:free',
    LLAMA_3_70B: 'meta-llama/llama-3.3-70b-instruct:free',
    GEMINI_FLASH_15: 'google/gemini-flash-1.5:free',  // Previous version
} as const;

const DEFAULT_MODEL = AI_MODELS.GEMINI_2_FLASH;

// Prompt for parsing voice commands into transactions
const VOICE_PARSING_PROMPT = `Eres un asistente experto en finanzas personales. Tu trabajo es analizar comandos de voz en español y extraer transacciones financieras.

FORMATO DE RESPUESTA (JSON estricto):
{
  "transactions": [
    {
      "type": "income" | "expense",
      "amount": number,
      "currency": "USD" | "VES",
      "description": "string (breve)",
      "category": "string",
      "account": "string (banco o medio de pago)",
      "confidence": 0.0-1.0
    }
  ],
  "unparsed": "texto que no pudo ser interpretado"
}

REGLAS:
- Palabras clave para ingresos: cobré, recibí, ingresé, deposité, me pagaron
- Palabras clave para gastos: gasté, pagué, compré, invertí
- Si dice "compré X", es un gasto
- Si dice "vendí X", es un ingreso
- Moneda por defecto: USD (dólares)
- Si menciona "bolívares" o "Bs", usa VES
- Detecta bancos venezolanos: Banesco, Mercantil, Provincial, Venezuela
- Detecta medios de pago: Efectivo, Binance, PayPal, Zinli, Zelle
- Si no puedes determinar algo, usa valores razonables`;

export interface ParsedTransaction {
    type: 'income' | 'expense';
    amount: number;
    currency: 'USD' | 'VES';
    description: string;
    category: string;
    account: string;
    confidence: number;
}

export interface AIParsingResult {
    success: boolean;
    transactions: ParsedTransaction[];
    unparsed: string;
    model: string;
    error?: string;
}

// Store API key in memory (cached)
let cachedApiKey: string | null = null;

export async function setOpenRouterApiKey(key: string): Promise<void> {
    cachedApiKey = key;
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export async function getOpenRouterApiKey(): Promise<string | null> {
    if (cachedApiKey) return cachedApiKey;
    cachedApiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return cachedApiKey;
}

export async function isOpenRouterConfigured(): Promise<boolean> {
    const key = await getOpenRouterApiKey();
    return !!key;
}

/**
 * Parse voice text using AI
 */
export async function parseVoiceWithAI(
    text: string,
    model: string = DEFAULT_MODEL
): Promise<AIParsingResult> {
    const apiKey = await getOpenRouterApiKey();
    if (!apiKey) {
        return {
            success: false,
            transactions: [],
            unparsed: text,
            model,
            error: 'API key no configurada',
        };
    }

    try {
        console.log('[OpenRouter] Parsing:', text);
        console.log('[OpenRouter] Using model:', model);

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://dilo.app',
                'X-Title': 'Dilo App',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: VOICE_PARSING_PROMPT },
                    { role: 'user', content: `Analiza: "${text}"` },
                ],
                temperature: 0.3,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('[OpenRouter] API error:', errorText); // .warn to avoid LogBox popup
            return {
                success: false,
                transactions: [],
                unparsed: text,
                model,
                error: `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                transactions: [],
                unparsed: text,
                model,
                error: 'Sin respuesta del modelo',
            };
        }

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = content;
        const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        } else {
            // Try to find raw JSON
            const rawMatch = content.match(/\{[\s\S]*\}/);
            if (rawMatch) {
                jsonStr = rawMatch[0];
            }
        }

        try {
            const parsed = JSON.parse(jsonStr);
            console.log('[OpenRouter] Parsed result:', parsed);

            return {
                success: true,
                transactions: parsed.transactions || [],
                unparsed: parsed.unparsed || '',
                model,
            };
        } catch (parseError) {
            console.error('[OpenRouter] JSON parse error:', parseError);
            return {
                success: false,
                transactions: [],
                unparsed: text,
                model,
                error: 'Error parsing AI response',
            };
        }

    } catch (error: any) {
        console.error('[OpenRouter] Fetch error:', error);
        return {
            success: false,
            transactions: [],
            unparsed: text,
            model,
            error: error.message,
        };
    }
}

/**
 * Convert AI parsed transactions to app format
 */
export function convertToAppTransactions(
    parsed: ParsedTransaction[],
    categories: { id: string; name: string }[],
    bankKeywords: Record<string, string[]>
): any[] {
    return parsed.map(t => {
        // Find matching category
        const category = categories.find(c =>
            c.name.toLowerCase().includes(t.category.toLowerCase()) ||
            t.category.toLowerCase().includes(c.name.toLowerCase())
        ) || categories[0];

        // Find matching account
        let accountName = t.account.toLowerCase();
        for (const [bank, keywords] of Object.entries(bankKeywords)) {
            if (keywords.some(k => accountName.includes(k.toLowerCase()))) {
                accountName = bank;
                break;
            }
        }

        return {
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: t.type,
            amount: t.amount,
            amountOriginal: t.amount,
            currencyOriginal: t.currency,
            // FIXED: Pass the original values - conversion happens in VoiceConfirmation
            amountUsd: t.amount, // Will be converted if VES
            currency: t.currency,
            description: t.description,
            categoryId: category?.id || '',
            categoryName: category?.name || t.category,
            accountName: accountName,
            date: new Date().toISOString(),
            source: 'voice-ai',
            confidence: t.confidence,
            requiresConversion: t.currency === 'VES', // Flag for VES transactions
        };
    });
}
