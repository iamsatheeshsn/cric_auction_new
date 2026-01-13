
import { describe, it, expect } from 'vitest';
import { getResourcePercentage, calculateDLSTarget, calculateResourcesAfterInterruption, RESOURCE_TABLE_T20 } from './dlsUtils';

describe('DLS Utils', () => {
    describe('RESOURCE_TABLE_T20', () => {
        it('should have 21 rows (0-20 overs)', () => {
            expect(Object.keys(RESOURCE_TABLE_T20).length).toBe(21);
        });
        it('should have correct value for 20 overs, 0 wickets', () => {
            expect(RESOURCE_TABLE_T20[20][0]).toBe(100.0);
        });
        it('should have 0% resources for 0 overs', () => {
            expect(RESOURCE_TABLE_T20[0][0]).toBe(0);
        });
    });

    describe('getResourcePercentage', () => {
        it('should return 100% for 20 overs, 0 wickets', () => {
            expect(getResourcePercentage(20, 0)).toBe(100.0);
        });
        it('should return correct value for 20 overs, 9 wickets', () => {
            expect(getResourcePercentage(20, 9)).toBe(4.7);
        });
        it('should return 0% for 0 overs', () => {
            expect(getResourcePercentage(0, 0)).toBe(0);
        });
        it('should return 0% for 10 wickets lost', () => {
            expect(getResourcePercentage(10, 10)).toBe(0);
        });
        it('should cap at 100% for >20 overs', () => {
            expect(getResourcePercentage(25, 0)).toBe(100);
        });
    });

    describe('calculateDLSTarget', () => {
        it('should calculate correct target when Team 2 has fewer resources', () => {
            // T1: 200, R1: 100, R2: 90
            // Target = 200 * 0.9 = 180. Revised Target = 181.
            const result = calculateDLSTarget(200, 100, 90, 'T20');
            expect(result.revisedTarget).toBe(181);
            expect(result.projectedScore).toBe(180);
        });

        it('should calculate correct target when Team 2 has more resources', () => {
            // T1: 150, R1: 80, R2: 90
            // G50 for T20 is 160.
            // Target = 150 + 160 * (10/100) = 150 + 16 = 166. Revised Target = 167.
            const result = calculateDLSTarget(150, 80, 90, 'T20');
            expect(result.revisedTarget).toBe(167);
        });
    });

    describe('calculateResourcesAfterInterruption', () => {
        it('should calculating correct resource loss for interruption', () => {
            // 20 Over match
            // Rain at 5.0 overs (15 remaining). Wickets: 0.
            // Overs Lost: 4.
            // ResBefore = Res(15, 0) = 79.9
            // ResAfter = Res(11, 0) = 62.5
            // Expected Loss = 17.4

            const result = calculateResourcesAfterInterruption(20, 5, 0, 4);
            expect(result.resBefore).toBe(79.9);
            expect(result.resAfter).toBe(62.5);
            expect(result.resourceLost).toBeCloseTo(17.4, 5);
        });

        it('should handle zero loss if no overs lost', () => {
            const result = calculateResourcesAfterInterruption(20, 5, 0, 0);
            expect(result.resourceLost).toBe(0);
        });
    });
});
