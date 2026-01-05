/**
 * Simplified DLS Resource Table and Calculator
 * Based on Standard Duckworth-Lewis resource percentages for T20/ODI.
 * 
 * Note: This is an approximation using standard public domain tables.
 * Professional DLS (Stern edition) uses proprietary software.
 */

// Resource percentage table (Row: Overs Left, Col: Wickets Lost 0-9)
// Simplified for T20 (20 overs max)
// Values represented as Percentage. 
// Source: Standard DLS Table for 20 overs.
const RESOURCE_TABLE_T20 = {
    20: [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9, 4.7],
    19: [96.1, 90.2, 82.7, 73.2, 61.6, 48.4, 34.6, 21.9, 11.9, 4.7],
    18: [92.2, 86.9, 80.1, 71.3, 60.5, 47.7, 34.3, 21.8, 11.9, 4.7],
    17: [88.2, 83.5, 77.4, 69.3, 59.2, 46.9, 33.9, 21.7, 11.9, 4.7],
    16: [84.1, 80.0, 74.5, 67.1, 57.7, 46.1, 33.5, 21.5, 11.8, 4.7],
    15: [79.9, 76.4, 71.5, 64.8, 56.1, 45.1, 33.0, 21.3, 11.8, 4.7],
    14: [75.7, 72.6, 68.4, 62.3, 54.4, 44.0, 32.5, 21.1, 11.7, 4.7],
    13: [71.4, 68.8, 65.1, 59.7, 52.5, 42.8, 31.8, 20.9, 11.7, 4.7],
    12: [67.0, 64.9, 61.7, 56.9, 50.4, 41.5, 31.1, 20.6, 11.6, 4.7],
    11: [62.5, 60.8, 58.1, 54.0, 48.2, 40.0, 30.3, 20.2, 11.5, 4.7],
    10: [57.9, 56.6, 54.4, 50.8, 45.8, 38.4, 29.4, 19.8, 11.4, 4.7],
    9: [53.2, 52.3, 50.5, 47.5, 43.2, 36.6, 28.3, 19.3, 11.3, 4.7],
    8: [48.4, 47.8, 46.4, 44.0, 40.4, 34.6, 27.1, 18.7, 11.1, 4.7],
    7: [43.5, 43.1, 42.1, 40.2, 37.3, 32.4, 25.7, 18.0, 10.9, 4.7],
    6: [38.5, 38.3, 37.6, 36.2, 33.9, 29.9, 24.1, 17.2, 10.6, 4.7],
    5: [33.3, 33.2, 32.9, 31.9, 30.2, 27.1, 22.2, 16.2, 10.3, 4.7],
    4: [27.9, 27.9, 27.8, 27.2, 26.1, 23.9, 19.9, 15.0, 9.8, 4.7],
    3: [22.3, 22.3, 22.3, 22.0, 21.5, 20.0, 17.2, 13.4, 9.1, 4.7],
    2: [16.5, 16.5, 16.5, 16.4, 16.2, 15.5, 13.7, 11.1, 8.0, 4.6],
    1: [10.2, 10.2, 10.2, 10.2, 10.2, 10.0, 9.2, 7.9, 6.2, 3.9],
    0: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

// G50 is the average score for 50 overs. 
// For T20, it is typically lower, around 160-170, but DLS standard uses 245 for ODI.
// We will allow passing G50, default to 245 (ODI standard) or 160 (T20 adjusted).
const G50_ODI = 245;
const G50_T20 = 160;

/**
 * Get resource percentage remaining
 * @param {number} oversLeft - Overs remaining (can be decimal, e.g., 10.4)
 * @param {number} wicketsLost - Number of wickets lost (0-9). 10 wickets = 0 resource.
 * @returns {number} Percentage of resources remaining (0-100)
 */
export const getResourcePercentage = (oversLeft, wicketsLost) => {
    if (wicketsLost >= 10) return 0;

    // Simple interpolation for partial overs could be added here
    // For now, we take the ceiling or nearest integer over for the table lookup
    // DLS usually uses ball-by-ball, but table is per over.
    // Let's use simple rounding to nearest available integer row for this simplified version.

    const overIndex = Math.ceil(oversLeft);
    if (overIndex > 20) return 100; // Assuming T20 table for now
    if (overIndex <= 0) return 0;

    const row = RESOURCE_TABLE_T20[overIndex];
    if (!row) return 0;

    return row[wicketsLost];
};

/**
 * Calculate Revised Target
 * @param {number} team1Score - Runs scored by Team 1
 * @param {number} team1Resources - % Resources Team 1 had available (usually 100 if full match)
 * @param {number} team2Resources - % Resources Team 2 has available (calculated from interruptions)
 * @param {number} g50 - Average score constant (default 160 for T20 mode)
 * @returns {object} { target, parScore }
 */
export const calculateDLSTarget = (team1Score, team1Resources = 100, team2Resources, matchType = 'T20') => {
    const g50 = matchType === 'ODI' ? G50_ODI : G50_T20;
    let target;

    // R2 = Team 2 Resources
    // R1 = Team 1 Resources

    if (team2Resources < team1Resources) {
        // Case 1: Team 2 has fewer resources than Team 1
        // Target = Team 1 * (R2 / R1)
        target = Math.floor(team1Score * (team2Resources / team1Resources));
    } else {
        // Case 2: Team 2 has more resources than Team 1 (e.g. T1 had interruption, T2 has full overs)
        // Target = Team 1 + G50 * (R2 - R1) / 100
        target = Math.floor(team1Score + (g50 * (team2Resources - team1Resources) / 100));
    }

    // Target is always Runs to Win, so +1 to the calculated score
    return {
        revisedTarget: target + 1,
        projectedScore: target // The tie score
    };
};

/**
 * Helper to calculate resource percentage for a specific interruption
 * @param {number} totalOvers - Total overs in the inning (e.g., 20)
 * @param {number} oversBowled - Overs already bowled when interruption happened
 * @param {number} wicketsLost - Wickets down at interruption
 * @param {number} oversLost - How many overs were lost due to rain
 */
export const calculateResourcesAfterInterruption = (totalOvers, oversBowled, wicketsLost, oversLost) => {
    // Resources initially available (at oversBowled)
    const oversRemainingBefore = totalOvers - oversBowled;
    const resBefore = getResourcePercentage(oversRemainingBefore, wicketsLost);

    // Resources available after interruption
    // Overs remaining is reduced by oversLost
    const oversRemainingAfter = oversRemainingBefore - oversLost;
    const resAfter = getResourcePercentage(oversRemainingAfter, wicketsLost);

    return {
        resBefore,
        resAfter,
        resourceLost: Math.max(0, resBefore - resAfter)
    };
};

// Default export for resource table if needed, though mostly internal
export default {
    calculateDLSTarget,
    calculateResourcesAfterInterruption,
    getResourcePercentage
};
