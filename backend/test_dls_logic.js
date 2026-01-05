
// RESOURCE TABLE T20 (Mirrored from frontend/src/utils/dlsUtils.js)
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

const G50_ODI = 245;
const G50_T20 = 160;

const getResourcePercentage = (oversLeft, wicketsLost) => {
    if (wicketsLost >= 10) return 0;
    const overIndex = Math.ceil(oversLeft);
    if (overIndex > 20) return 100;
    if (overIndex <= 0) return 0;
    const row = RESOURCE_TABLE_T20[overIndex];
    if (!row) return 0;
    return row[wicketsLost];
};

const calculateDLSTarget = (team1Score, team1Resources, team2Resources, matchType = 'T20') => {
    const g50 = matchType === 'ODI' ? G50_ODI : G50_T20;
    let target;

    if (team2Resources < team1Resources) {
        target = Math.floor(team1Score * (team2Resources / team1Resources));
    } else {
        target = Math.floor(team1Score + (g50 * (team2Resources - team1Resources) / 100));
    }

    return {
        revisedTarget: target + 1,
        projectedScore: target
    };
};

// --- TESTS ---

function testScenario(name, scenario) {
    console.log(`\n--- Test: ${name} ---`);
    const { totalOvers, matchFormat, team1Score, overInterruption, wicketsAtInterruption, oversLost } = scenario;

    console.log(`Input: ${totalOvers} overs, Sort: ${matchFormat}, T1 Score: ${team1Score}`);
    console.log(`Int: After ${overInterruption} ov, ${wicketsAtInterruption} wkts, Lose ${oversLost} ov`);

    // 1. Calculate Team 1 Resources (Dynamic for T10 support)
    const t1Resources = getResourcePercentage(totalOvers, 0);
    console.log(`T1 Initial Resources: ${t1Resources}%`);

    // 2. Calculate Team 2 Resources
    const oversRemainingInitial = totalOvers - overInterruption;
    const resInitial = getResourcePercentage(oversRemainingInitial, wicketsAtInterruption);

    const oversRemainingFinal = oversRemainingInitial - oversLost;
    const resFinal = getResourcePercentage(oversRemainingFinal, wicketsAtInterruption);

    const loss = Math.max(0, resInitial - resFinal);
    const t2Resources = t1Resources - loss;

    console.log(`T2 Final Resources: ${t2Resources.toFixed(2)}% (Lost: ${loss.toFixed(2)}%)`);

    // 3. Calculate Target
    const result = calculateDLSTarget(team1Score, t1Resources, t2Resources, matchFormat);
    console.log(`>>> Revised Target: ${result.revisedTarget} (Par: ${result.projectedScore})`);
    return result;
}

// Case 1: Standard T20 Rain Rule
// T1: 150 in 20 ov.
// T2: Rain at 5.0 ov (0 wkts). Lose 5 overs.
// 20 overs match -> T1 Res = 100%
// Left: 15 ov (79.9%). Final Left: 10 ov (57.9%). Loss = 22%. T2 Res = 78%.
testScenario("Standard T20 Rain Delay", {
    totalOvers: 20,
    matchFormat: 'T20',
    team1Score: 150,
    overInterruption: 5.0,
    wicketsAtInterruption: 0,
    oversLost: 5
});

// Case 2: T10 Match (Custom)
// T1: 100 in 10 ov.
// T2: Rain at 2.0 ov (1 wkt). Lose 2 overs.
// 10 overs match -> T1 Res = 57.9% (approx)
// Initial Left: 8 ov (47.8%). Final Left: 6 ov (38.3%). Loss = 9.5%.
// T2 Res = 57.9% - 9.5% = 48.4%.
testScenario("T10 Match Interruption", {
    totalOvers: 10,
    matchFormat: 'T10',
    team1Score: 100,
    overInterruption: 2.0,
    wicketsAtInterruption: 1,
    oversLost: 2
});

// Case 3: Five5 Match (Extremely Short)
// T1: 60 in 5 ov.
// T2: Rain at 1.0 ov (0 wkts). Lose 2 overs.
// 5 overs match -> T1 Res = 33.3%
// Initial Left: 4 ov (27.9%). Final Left: 2 ov (16.5%). Loss = 11.4%.
// T2 Res = 21.9%.
testScenario("Five5 Match Interruption", {
    totalOvers: 5,
    matchFormat: 'FIVE5',
    team1Score: 60,
    overInterruption: 1.0,
    wicketsAtInterruption: 0,
    oversLost: 2
});
