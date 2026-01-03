// Tests for BCV Service - Pure Functions Only
// These tests only cover utility functions that don't require React Native

// Mock the entire bcv module to avoid AsyncStorage and axios dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('axios', () => ({
    get: jest.fn(),
}));

// Now we can safely import
import { formatUsd, formatVes, usdToVes, vesToUsd } from '../bcv';

describe('BCV Service - Pure Functions', () => {
    describe('usdToVes', () => {
        it('should convert USD to VES correctly', () => {
            expect(usdToVes(100, 50)).toBe(5000);
            expect(usdToVes(1, 300)).toBe(300);
            expect(usdToVes(0.5, 100)).toBe(50);
        });

        it('should return 0 for invalid rate', () => {
            expect(usdToVes(100, 0)).toBe(0);
            expect(usdToVes(100, -50)).toBe(0);
        });

        it('should handle zero amount', () => {
            expect(usdToVes(0, 300)).toBe(0);
        });
    });

    describe('vesToUsd', () => {
        it('should convert VES to USD correctly', () => {
            expect(vesToUsd(5000, 50)).toBe(100);
            expect(vesToUsd(300, 300)).toBe(1);
            expect(vesToUsd(150, 50)).toBe(3);
        });

        it('should return 0 for invalid rate', () => {
            expect(vesToUsd(5000, 0)).toBe(0);
            expect(vesToUsd(5000, -50)).toBe(0);
        });

        it('should handle zero amount', () => {
            expect(vesToUsd(0, 300)).toBe(0);
        });
    });

    describe('formatVes', () => {
        it('should format VES amounts correctly', () => {
            const formatted = formatVes(1234.56);
            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('string');
        });

        it('should handle zero', () => {
            const formatted = formatVes(0);
            expect(formatted).toContain('0');
        });
    });

    describe('formatUsd', () => {
        it('should format USD amounts with currency symbol', () => {
            const formatted = formatUsd(1234.56);
            expect(formatted).toContain('$');
        });

        it('should handle zero', () => {
            const formatted = formatUsd(0);
            expect(formatted).toContain('$');
        });
    });
});
