// Tests for AI Parser Logic
// These tests cover the voice command parsing logic

// ============================================
// Intent Detection Logic (from aiParser.ts)
// ============================================

type Intent = 'transaction' | 'command' | 'question' | 'greeting' | 'unknown';

const detectLocalIntent = (text: string): Intent => {
    const lowerText = text.toLowerCase().trim();

    if (!lowerText) return 'unknown';

    // Transaction keywords (expenses)
    const expenseKeywords = ['gasté', 'gaste', 'pagué', 'pague', 'compré', 'compre', 'gastos'];
    // Transaction keywords (income)
    const incomeKeywords = ['recibí', 'recibi', 'pagaron', 'cobré', 'cobre', 'gané', 'gane', 'ingreso'];
    // Command keywords
    const commandKeywords = ['backup', 'respaldo', 'exportar', 'balance', 'resumen', 'reporte'];
    // Question keywords
    const questionKeywords = ['qué', 'que', 'cuánto', 'cuanto', 'dime', 'cuál', 'cual', 'cómo'];
    // Greeting keywords (no overlap with questions)
    const greetingKeywords = ['hola', 'buenos', 'buenas', 'hello', 'hey', 'saludos'];

    if (expenseKeywords.some(k => lowerText.includes(k))) return 'transaction';
    if (incomeKeywords.some(k => lowerText.includes(k))) return 'transaction';
    if (commandKeywords.some(k => lowerText.includes(k))) return 'command';
    if (greetingKeywords.some(k => lowerText.includes(k))) return 'greeting';
    if (questionKeywords.some(k => lowerText.includes(k))) return 'question';

    return 'unknown';
};

// ============================================
// Amount Parsing Logic
// ============================================

interface ParsedCommand {
    type: 'income' | 'expense';
    amount: number;
    currency: string;
    category: string;
    description: string;
    confidence: number;
    rawText: string;
}

const parseWithKeywords = (text: string): ParsedCommand | null => {
    const lowerText = text.toLowerCase();

    // Extract amount (supports decimals with . or ,)
    const amountMatch = lowerText.match(/(\d+[.,]?\d*)/);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return null;

    // Detect type
    const expenseKeywords = ['gasté', 'gaste', 'pagué', 'pague', 'compré', 'compre'];
    const incomeKeywords = ['recibí', 'recibi', 'pagaron', 'cobré', 'cobre', 'ingreso'];

    let type: 'income' | 'expense' = 'expense';
    if (incomeKeywords.some(k => lowerText.includes(k))) {
        type = 'income';
    }

    // Detect currency
    let currency = 'USD';
    if (lowerText.includes('bolívar') || lowerText.includes('bolivar') || lowerText.includes('bs')) {
        currency = 'VES';
    } else if (lowerText.includes('usdt') || lowerText.includes('tether')) {
        currency = 'USDT';
    }

    // Detect category
    let category = 'other';
    const categoryMap: Record<string, string> = {
        'comida': 'food', 'almuerzo': 'food', 'cena': 'food', 'desayuno': 'food',
        'taxi': 'transport', 'uber': 'transport', 'bus': 'transport',
        'gasolina': 'fuel', 'nafta': 'fuel', 'combustible': 'fuel',
    };

    for (const [keyword, cat] of Object.entries(categoryMap)) {
        if (lowerText.includes(keyword)) {
            category = cat;
            break;
        }
    }

    return {
        type,
        amount,
        currency,
        category,
        description: text,
        confidence: 0.8,
        rawText: text,
    };
};

// ============================================
// TESTS
// ============================================

describe('AI Parser - Intent Detection', () => {
    describe('detectLocalIntent', () => {
        it('should detect expense intent', () => {
            expect(detectLocalIntent('gasté 20 dólares')).toBe('transaction');
            expect(detectLocalIntent('pagué la cuenta')).toBe('transaction');
            expect(detectLocalIntent('compré comida')).toBe('transaction');
        });

        it('should detect income intent', () => {
            expect(detectLocalIntent('recibí 100 dólares')).toBe('transaction');
            expect(detectLocalIntent('me pagaron el salario')).toBe('transaction');
            expect(detectLocalIntent('cobré por el trabajo')).toBe('transaction');
        });

        it('should detect command intent', () => {
            expect(detectLocalIntent('hacer backup')).toBe('command');
            expect(detectLocalIntent('hacer respaldo')).toBe('command');
            expect(detectLocalIntent('exportar reporte')).toBe('command');
        });

        it('should detect question intent', () => {
            expect(detectLocalIntent('qué día es hoy')).toBe('question');
            expect(detectLocalIntent('cuánto gasté')).toBe('question');
        });

        it('should detect greeting intent', () => {
            expect(detectLocalIntent('hola')).toBe('greeting');
            expect(detectLocalIntent('buenos días')).toBe('greeting');
        });

        it('should return unknown for unrecognized text', () => {
            expect(detectLocalIntent('asdfghjkl')).toBe('unknown');
            expect(detectLocalIntent('')).toBe('unknown');
        });
    });
});

describe('AI Parser - Amount Parsing', () => {
    describe('parseWithKeywords', () => {
        it('should parse expense with amount', () => {
            const result = parseWithKeywords('gasté 50 dólares');
            expect(result).not.toBeNull();
            expect(result?.type).toBe('expense');
            expect(result?.amount).toBe(50);
        });

        it('should parse income', () => {
            const result = parseWithKeywords('recibí 200 dólares');
            expect(result).not.toBeNull();
            expect(result?.type).toBe('income');
            expect(result?.amount).toBe(200);
        });

        it('should detect USD currency', () => {
            const result = parseWithKeywords('gasté 50 dólares');
            expect(result?.currency).toBe('USD');
        });

        it('should detect VES currency', () => {
            const result = parseWithKeywords('pagué 1000 bolívares');
            expect(result?.currency).toBe('VES');
        });

        it('should detect USDT currency', () => {
            const result = parseWithKeywords('recibí 50 usdt');
            expect(result?.currency).toBe('USDT');
        });

        it('should return null if no amount', () => {
            const result = parseWithKeywords('gasté mucho');
            expect(result).toBeNull();
        });

        it('should handle decimal amounts', () => {
            const result = parseWithKeywords('gasté 25.50 dólares');
            expect(result?.amount).toBe(25.5);
        });

        it('should detect food category', () => {
            const result = parseWithKeywords('gasté 15 en comida');
            expect(result?.category).toBe('food');
        });

        it('should detect transport category', () => {
            const result = parseWithKeywords('pagué 10 de taxi');
            expect(result?.category).toBe('transport');
        });

        it('should detect fuel category', () => {
            const result = parseWithKeywords('gasté 30 en gasolina');
            expect(result?.category).toBe('fuel');
        });

        it('should have confidence level', () => {
            const result = parseWithKeywords('gasté 20 dólares');
            expect(result?.confidence).toBeGreaterThan(0);
        });

        it('should include raw text', () => {
            const text = 'gasté 50 dólares';
            const result = parseWithKeywords(text);
            expect(result?.rawText).toBe(text);
        });
    });
});
