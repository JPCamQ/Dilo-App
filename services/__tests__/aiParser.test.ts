// Tests for AI Parser Service
import { detectLocalIntent, parseWithKeywords } from '../aiParser';

describe('aiParser', () => {
    describe('detectLocalIntent', () => {
        it('should detect transaction intent for expense keywords', () => {
            expect(detectLocalIntent('gasté 20 dólares')).toBe('transaction');
            expect(detectLocalIntent('pagué la cuenta')).toBe('transaction');
            expect(detectLocalIntent('compré comida')).toBe('transaction');
        });

        it('should detect transaction intent for income keywords', () => {
            expect(detectLocalIntent('recibí 100 dólares')).toBe('transaction');
            expect(detectLocalIntent('me pagaron el salario')).toBe('transaction');
            expect(detectLocalIntent('cobré por el trabajo')).toBe('transaction');
        });

        it('should detect command intent', () => {
            expect(detectLocalIntent('hacer backup')).toBe('command');
            expect(detectLocalIntent('hacer respaldo')).toBe('command');
            expect(detectLocalIntent('exportar reporte')).toBe('command');
            expect(detectLocalIntent('ver mi balance')).toBe('command');
        });

        it('should detect question intent', () => {
            expect(detectLocalIntent('qué día es hoy')).toBe('question');
            expect(detectLocalIntent('cuánto gasté esta semana')).toBe('question');
            expect(detectLocalIntent('dime mi saldo')).toBe('question');
        });

        it('should detect greeting intent', () => {
            expect(detectLocalIntent('hola')).toBe('greeting');
            expect(detectLocalIntent('buenos días')).toBe('greeting');
            expect(detectLocalIntent('qué tal')).toBe('greeting');
        });

        it('should return unknown for unrecognized text', () => {
            expect(detectLocalIntent('asdfghjkl')).toBe('unknown');
            expect(detectLocalIntent('')).toBe('unknown');
        });
    });

    describe('parseWithKeywords', () => {
        it('should parse expense in USD', () => {
            const result = parseWithKeywords('gasté 50 dólares en comida');

            expect(result).not.toBeNull();
            expect(result?.type).toBe('expense');
            expect(result?.amount).toBe(50);
            expect(result?.currency).toBe('USD');
        });

        it('should parse expense in VES (bolívares)', () => {
            const result = parseWithKeywords('pagué 1000 bolívares por el taxi');

            expect(result).not.toBeNull();
            expect(result?.type).toBe('expense');
            expect(result?.amount).toBe(1000);
            expect(result?.currency).toBe('VES');
        });

        it('should parse income', () => {
            const result = parseWithKeywords('recibí 200 dólares de salario');

            expect(result).not.toBeNull();
            expect(result?.type).toBe('income');
            expect(result?.amount).toBe(200);
            expect(result?.currency).toBe('USD');
        });

        it('should detect food category', () => {
            const result = parseWithKeywords('gasté 15 en comida');

            expect(result).not.toBeNull();
            expect(result?.category).toBe('food');
        });

        it('should detect transport category', () => {
            const result = parseWithKeywords('pagué 10 dólares de taxi');

            expect(result).not.toBeNull();
            expect(result?.category).toBe('transport');
        });

        it('should detect fuel category', () => {
            const result = parseWithKeywords('gasté 30 en gasolina');

            expect(result).not.toBeNull();
            expect(result?.category).toBe('fuel');
        });

        it('should return null if no amount found', () => {
            const result = parseWithKeywords('gasté mucho dinero');
            expect(result).toBeNull();
        });

        it('should handle decimal amounts', () => {
            const result = parseWithKeywords('gasté 25.50 dólares');

            expect(result).not.toBeNull();
            expect(result?.amount).toBe(25.5);
        });

        it('should handle amounts with comma decimal separator', () => {
            const result = parseWithKeywords('pagué 100,75 bolívares');

            expect(result).not.toBeNull();
            expect(result?.amount).toBe(100.75);
        });

        it('should detect USDT currency', () => {
            const result = parseWithKeywords('recibí 50 usdt');

            expect(result).not.toBeNull();
            expect(result?.currency).toBe('USDT');
        });

        it('should have confidence level', () => {
            const result = parseWithKeywords('gasté 20 dólares');

            expect(result).not.toBeNull();
            expect(result?.confidence).toBeGreaterThan(0);
            expect(result?.confidence).toBeLessThanOrEqual(1);
        });

        it('should include raw text', () => {
            const rawText = 'gasté 50 dólares en el mercado';
            const result = parseWithKeywords(rawText);

            expect(result).not.toBeNull();
            expect(result?.rawText).toBe(rawText);
        });
    });
});
