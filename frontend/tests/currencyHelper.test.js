import { describe, it, expect } from 'vitest';
import { formatCurrencyValue } from '../src/utils/currencyHelper.js';

describe('currencyHelper', () => {
    describe('formatCurrencyValue', () => {
        // INR Tests
        it('should format INR Crores correctly', () => {
            expect(formatCurrencyValue(15000000, 'INR')).toBe('₹ 1.50 Cr');
        });
        it('should format INR Lakhs correctly', () => {
            expect(formatCurrencyValue(550000, 'INR')).toBe('₹ 5.50 L');
        });
        it('should format small INR amounts correctly', () => {
            expect(formatCurrencyValue(10000, 'INR')).toBe('₹ 10,000');
        });

        // Standard Tests
        it('should format Standard Millions (decimal) correctly', () => {
            expect(formatCurrencyValue(1500000, 'Standard')).toBe('₹ 1.50 M');
        });
        it('should format Standard Millions (tens) correctly', () => {
            expect(formatCurrencyValue(15000000, 'Standard')).toBe('₹ 15.00 M');
        });
        it('should format Standard Thousands correctly', () => {
            expect(formatCurrencyValue(1500, 'Standard')).toBe('₹ 1.50 K');
        });
        it('should format Standard Small amounts correctly', () => {
            expect(formatCurrencyValue(500, 'Standard')).toBe('₹ 500');
        });

        // Points Tests
        it('should format Points Large correctly', () => {
            expect(formatCurrencyValue(1000000, 'Points')).toBe('Pts 1,000,000');
        });
        it('should format Points Small correctly', () => {
            expect(formatCurrencyValue(500, 'Points')).toBe('Pts 500');
        });

        // Edge Cases
        it('should handle zero correctly', () => {
            expect(formatCurrencyValue(0, 'INR')).toBe('₹ 0');
        });
        it('should handle string input correctly', () => {
            expect(formatCurrencyValue("100000", 'INR')).toBe('₹ 1.00 L');
        });
    });
});
