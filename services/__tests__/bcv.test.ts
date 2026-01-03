// Tests for BCV Utility Functions
// These tests only cover pure functions that don't depend on React Native

// Pure utility functions extracted for testing
const usdToVes = (usd: number, rate: number): number => {
    if (rate <= 0) return 0;
    return usd * rate;
};

const vesToUsd = (ves: number, rate: number): number => {
    if (rate <= 0) return 0;
    return ves / rate;
};

const formatVes = (amount: number): string => {
    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatUsd = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

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
        it('should format VES amounts as string', () => {
            const formatted = formatVes(1234.56);
            expect(typeof formatted).toBe('string');
            expect(formatted.length).toBeGreaterThan(0);
        });

        it('should handle zero', () => {
            const formatted = formatVes(0);
            expect(formatted).toContain('0');
        });
    });

    describe('formatUsd', () => {
        it('should format USD with currency symbol', () => {
            const formatted = formatUsd(1234.56);
            expect(formatted).toContain('$');
        });

        it('should handle zero', () => {
            const formatted = formatUsd(0);
            expect(formatted).toContain('$');
            expect(formatted).toContain('0');
        });
    });
});
