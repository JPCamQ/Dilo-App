// Tests for AI Parser Service - Pure Functions Only
// These tests only cover utility functions that don't require external APIs

// Mock the constants module
jest.mock('@/constants/categories', () => ({
    CATEGORY_KEYWORDS: {
        'comida': 'food',
        'almuerzo': 'food',
        'cena': 'food',
        'taxi': 'transport',
        'uber': 'transport',
        'gasolina': 'fuel',
        'nafta': 'fuel',
    },
    DEFAULT_CATEGORIES: [
        { id: 'food', name: 'Comida' },
        { id: 'transport', name: 'Transporte' },
        { id: 'fuel', name: 'Combustible' },
    ],
}));

jest.mock('@/constants/env', () => ({
    DEEPSEEK_API_KEY: 'test-key',
}));

import { detectLocalIntent, parseWithKeywords } from '../aiParser';

describe('aiParser - Pure Functions', () => {
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
        });

        it('should detect question intent', () => {
            expect(detectLocalIntent('qué día es hoy')).toBe('question');
            expect(detectLocalIntent('cuánto gasté esta semana')).toBe('question');
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

        it('should detect USD currency by default', () => {
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

        it('should return null if no amount found', () => {
            const result = parseWithKeywords('gasté mucho dinero');
            expect(result).toBeNull();
        });

        it('should handle decimal amounts', () => {
            const result = parseWithKeywords('gasté 25.50 dólares');
            expect(result?.amount).toBe(25.5);
        });

        it('should include raw text', () => {
            const rawText = 'gasté 50 dólares';
            const result = parseWithKeywords(rawText);
            expect(result?.rawText).toBe(rawText);
        });

        it('should have confidence level', () => {
            const result = parseWithKeywords('gasté 20 dólares');
            expect(result?.confidence).toBeGreaterThan(0);
            expect(result?.confidence).toBeLessThanOrEqual(1);
        });
    });
});
