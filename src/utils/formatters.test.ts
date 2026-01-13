import { describe, it, expect, beforeAll } from 'vitest';
import { formatCurrency, formatDate } from './formatters';

describe('formatters', () => {
    beforeAll(() => {
        // Mock navigator for consistent locale in tests
        Object.defineProperty(globalThis.navigator, 'language', {
            value: 'es-CL',
            configurable: true
        });
    });

    describe('formatCurrency', () => {
        it('formats numbers as CLP currency', () => {
            const result = formatCurrency(1000);
            // Some environments use $ or CLP symbol depending on full ICU support
            // We check if it contains 1.000 (CLP uses dot as thousands separator in es-CL)
            expect(result).toMatch(/1\.000/);
        });

        it('handles negative numbers', () => {
            const result = formatCurrency(-500);
            expect(result).toMatch(/500/);
        });
    });

    describe('formatDate', () => {
        it('formats ISO dates correctly', () => {
            const result = formatDate('2024-01-01');
            // es-CL short month for Jan is usually 'ene'
            expect(result).toMatch(/1.*ene.*2024/i);
        });
    });
});
