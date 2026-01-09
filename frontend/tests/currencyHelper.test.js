import { formatCurrencyValue } from '../src/utils/currencyHelper.js';

const runTests = () => {
    console.log("Running Currency Logic Unit Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (desc, inputAmount, inputMode, expected) => {
        const actual = formatCurrencyValue(inputAmount, inputMode);
        if (actual === expected) {
            console.log(`[PASS] ${desc}`);
            passed++;
        } else {
            console.error(`[FAIL] ${desc}\n  Expected: '${expected}'\n  Actual:   '${actual}'`);
            failed++;
        }
    };

    // INR Tests
    assert('INR: Crores (1.5 Cr)', 15000000, 'INR', '₹ 1.50 Cr');
    assert('INR: Lakhs (5.5 L)', 550000, 'INR', '₹ 5.50 L');
    assert('INR: Small (10,000)', 10000, 'INR', '₹ 10,000');

    // Standard Tests
    assert('Standard: Millions (1.5 M)', 1500000, 'Standard', '₹ 1.50 M');
    assert('Standard: Millions (15 M)', 15000000, 'Standard', '₹ 15.00 M');
    assert('Standard: Thousands (1.5 K)', 1500, 'Standard', '₹ 1.50 K');
    assert('Standard: Small (500)', 500, 'Standard', '₹ 500');

    // Points Tests
    assert('Points: Large (1M)', 1000000, 'Points', 'Pts 1,000,000');
    assert('Points: Small (500)', 500, 'Points', 'Pts 500');

    // Edge Cases
    assert('Edge: Zero', 0, 'INR', '₹ 0');
    assert('Edge: String Input', "100000", 'INR', '₹ 1.00 L');

    console.log(`\nTotal: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
};

runTests();
