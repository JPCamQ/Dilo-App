// Dilo App - Comprehensive AI Assistant Service (DeepSeek Integration)
// Handles: Transactions, App Commands, General Questions, Financial Queries

import { CATEGORY_KEYWORDS, DEFAULT_CATEGORIES } from '@/constants/categories';
import ENV from '@/constants/env';
import { Currency, ParsedVoiceCommand, TransactionType } from '@/types';

const DEEPSEEK_API_KEY = ENV.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Intent types the AI can detect
export type AIIntent = 'transaction' | 'question' | 'command' | 'greeting' | 'unknown';

export interface AIResponse {
    intent: AIIntent;
    transactions?: ParsedVoiceCommand[];
    answer?: string;
    command?: {
        action: 'backup' | 'export' | 'summary' | 'rate' | 'balance' | 'help';
        params?: Record<string, any>;
    };
}

// Comprehensive system prompt for multi-intent detection
const SYSTEM_PROMPT = `Eres "Dilo", un asistente financiero inteligente para una app de finanzas personales en Venezuela.

Tu trabajo es CLASIFICAR el mensaje del usuario y responder apropiadamente.

## TIPOS DE INTENCIÓN:

1. **transaction** - El usuario quiere registrar un gasto o ingreso
   Palabras clave: gasté, pagué, compré, recibí, me pagaron, cobré, vendí

2. **question** - El usuario hace una pregunta general o sobre la app
   Palabras clave: qué día, cuál, cuánto, dime, cómo

3. **command** - El usuario quiere ejecutar una acción en la app
   Comandos: backup, respaldo, exportar, reporte, resumen, tasa, balance

4. **greeting** - Saludo simple
   Palabras: hola, buenos días, qué tal

## CATEGORÍAS FINANCIERAS:
Gastos: food, transport, fuel, services, health, clothes, entertainment, education, shopping, home
Ingresos: salary, sales, freelance, transfer-in, gift, investment, remittance

## MONEDAS: USD (dólares), VES (bolívares), USDT, USDC

## FORMATO DE RESPUESTA (JSON):

Para TRANSACCIÓN:
{
  "intent": "transaction",
  "transactions": [
    {"type": "expense"|"income", "amount": number, "currency": "USD"|"VES", "category": "food", "description": "string", "confidence": 0.9}
  ]
}

Para PREGUNTA:
{
  "intent": "question",
  "answer": "Respuesta amigable y útil en español"
}

Para COMANDO:
{
  "intent": "command",
  "command": {"action": "backup"|"export"|"summary"|"rate"|"balance"|"help", "params": {}}
}

Para SALUDO:
{
  "intent": "greeting",
  "answer": "¡Hola! Soy Dilo, tu asistente financiero. ¿En qué puedo ayudarte?"
}

RESPONDE SOLO JSON, sin explicaciones adicionales.`;

/**
 * Main AI processing function - handles all intents
 */
export async function processWithAI(userMessage: string): Promise<AIResponse> {
    try {
        console.log('🤖 Processing with AI:', userMessage);

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.2,
                max_tokens: 800,
            }),
        });

        if (!response.ok) {
            console.error('❌ DeepSeek API error:', response.status);
            return { intent: 'unknown', answer: 'Error al procesar tu mensaje.' };
        }

        const data = await response.json();
        const aiContent = data.choices?.[0]?.message?.content;

        if (!aiContent) {
            return { intent: 'unknown', answer: 'No obtuve respuesta del asistente.' };
        }

        console.log('🤖 AI Response:', aiContent);

        // Parse JSON response
        const parsed: AIResponse = JSON.parse(aiContent);
        return parsed;

    } catch (error: any) {
        console.error('❌ AI processing failed:', error.message);
        return { intent: 'unknown', answer: 'No pude procesar tu mensaje. Intenta de nuevo.' };
    }
}

/**
 * Quick intent detection without AI (for offline/fast response)
 */
export function detectLocalIntent(text: string): AIIntent {
    const lower = text.toLowerCase();

    // Transaction keywords
    const txKeywords = ['gaste', 'gasté', 'pague', 'pagué', 'compre', 'compré', 'recibi', 'recibí', 'cobre', 'cobré', 'vendi', 'vendí', 'me pagaron'];
    if (txKeywords.some(k => lower.includes(k))) return 'transaction';

    // Command keywords
    const cmdKeywords = ['backup', 'respaldo', 'exportar', 'reporte', 'resumen', 'tasa', 'balance', 'ayuda', 'help'];
    if (cmdKeywords.some(k => lower.includes(k))) return 'command';

    // Question keywords
    const qKeywords = ['que dia', 'qué día', 'cuanto', 'cuánto', 'cual', 'cuál', 'dime', 'como', 'cómo', 'donde', 'dónde'];
    if (qKeywords.some(k => lower.includes(k))) return 'question';

    // Greeting keywords
    const greetKeywords = ['hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'que tal', 'qué tal'];
    if (greetKeywords.some(k => lower.includes(k))) return 'greeting';

    return 'unknown';
}

/**
 * Parse voice command (backward compatible function)
 */
export async function parseVoiceCommand(voiceText: string): Promise<ParsedVoiceCommand[]> {
    const result = await processWithAI(voiceText);

    if (result.intent === 'transaction' && result.transactions) {
        return result.transactions;
    }

    return [];
}

/**
 * Get answer for questions
 */
export async function askQuestion(question: string): Promise<string> {
    const result = await processWithAI(question);
    return result.answer || 'No tengo una respuesta para eso.';
}

/**
 * Parse local keywords fallback
 */
export function parseWithKeywords(voiceText: string): ParsedVoiceCommand | null {
    const text = voiceText.toLowerCase();

    // Detect type
    let type: TransactionType = 'expense';
    const incomeWords = ['recibi', 'recibí', 'cobré', 'cobre', 'me pagaron', 'entró', 'ingreso', 'gané'];
    if (incomeWords.some(w => text.includes(w))) {
        type = 'income';
    }

    // Detect amount
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1].replace(',', '.'));

    // Detect currency
    let currency: Currency = 'USD';
    if (text.includes('bolivar') || text.includes('bolívar') || text.includes(' bs') || text.includes('bs.')) {
        currency = 'VES';
    } else if (text.includes('usdt')) {
        currency = 'USDT';
    } else if (text.includes('usdc')) {
        currency = 'USDC';
    }

    // Detect category
    let category = 'other';
    for (const [keyword, catId] of Object.entries(CATEGORY_KEYWORDS)) {
        if (text.includes(keyword)) {
            category = catId;
            break;
        }
    }

    const categoryInfo = DEFAULT_CATEGORIES.find(c => c.id === category);

    return {
        type,
        amount,
        currency,
        category,
        description: categoryInfo?.name || 'Otro',
        rawText: voiceText,
        confidence: 0.7,
    };
}

export const AIAssistant = {
    processWithAI,
    parseVoiceCommand,
    askQuestion,
    detectLocalIntent,
    parseWithKeywords,
};

export default AIAssistant;
