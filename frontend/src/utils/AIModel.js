
// AI Heuristics and Statistical Models

// 1. Player Similarity (Euclidean Distance on Normalized Stats)
export const findSimilarPlayers = (targetPlayer, allPlayers, limit = 3) => {
    if (!targetPlayer || !allPlayers || allPlayers.length === 0) return [];

    // Feature normalization helpers
    const getVal = (p, key) => parseFloat(p[key]) || 0;

    // We filter by same role first to ensure relevance
    const rolePlayers = allPlayers.filter(p => p.role === targetPlayer.role && p.id !== targetPlayer.id);
    if (rolePlayers.length === 0) return [];

    // Standard Reference Bounds (T20 Context)
    // Prevents skewing when dataset is small (e.g. only 2 players)
    const bounds = {
        'matches': { min: 0, max: 200 },
        'runs': { min: 0, max: 4000 },
        'wickets': { min: 0, max: 150 },
        'bat_avg': { min: 5, max: 50 },
        'strike_rate': { min: 80, max: 180 },
        'economy': { min: 4, max: 12 }
    };

    const normalize = (val, key) => {
        const b = bounds[key] || { min: 0, max: 100 };
        // Clamp value to bounds to avoid outliers distorting everything
        const clamped = Math.max(b.min, Math.min(b.max, val));
        return (clamped - b.min) / (b.max - b.min);
    };

    const stats = ['matches', 'runs', 'wickets', 'bat_avg', 'strike_rate', 'economy'];

    const scores = rolePlayers.map(p => {
        let distSq = 0;
        // Weights: Strike Rate and Economy are usually more defining for T20 impact
        const weights = { runs: 1, wickets: 1.2, bat_avg: 1.5, strike_rate: 2.5, economy: 2.5, matches: 0.5 };

        stats.forEach(key => {
            const v1 = normalize(getVal(targetPlayer, key), key);
            const v2 = normalize(getVal(p, key), key);
            distSq += weights[key] * Math.pow(v1 - v2, 2);
        });

        // Convert distance to similarity score (0 to 1)
        // 1 / (1 + distance)
        return { ...p, similarity: 1 / (1 + Math.sqrt(distSq)) };
    });

    return scores.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
};

// 2. Smart Win Probability (Logistic Regression Proxy)
export const calculateWinProbability = (runsRequired, ballsRemaining, wicketsInHand, target) => {
    if (runsRequired <= 0) return 100;
    if (ballsRemaining <= 0) return 0;
    if (wicketsInHand <= 0) return 0;

    const rrr = runsRequired / (ballsRemaining / 6);
    const oversLeft = ballsRemaining / 6;

    // Feature Engineering
    // Base probability starts at 50%
    let logOdds = 0;

    // Coefficients (Heuristic based on modern T20 data)

    // RRR Impact: 
    // Pivot at 9.0 RPO (modern par). 
    // If RRR is 9, odds are neutral (if wickets are decent).
    // Gain 0.5 log-odds for every 1 run less in RRR.
    logOdds -= (rrr - 9.0) * 0.55;

    // Wickets Impact:
    // Wickets in hand is critical. 7 wickets is safe baseline.
    // Losing early wickets hurts a lot.
    logOdds += (wicketsInHand - 7) * 0.4;

    // Death Overs Pressure:
    // If < 5 overs left and RRR > 10, pressure mounts exponentially.
    if (oversLeft < 5 && rrr > 10) {
        logOdds -= (12 - oversLeft) * 0.2;
    }

    // Settled Batsmen Bonus (Proxy):
    // If wickets > 7 and overs < 10, batting team is set only if RRR isn't crazy
    if (wicketsInHand >= 7 && oversLeft < 10 && rrr < 11) {
        logOdds += 0.5;
    }

    // Sigmoid Function
    const prob = 1 / (1 + Math.exp(-logOdds)); // 0 to 1

    return Math.max(1, Math.min(99, (prob * 100).toFixed(1)));
};

// 3. Auction Advisor
export const getAuctionAdvice = (team, squadPlayers, unsoldPlayers) => {
    if (!team) return null;

    const advice = {
        message: "Looking good!",
        urgentNeeds: [],
        suggestedBidLimit: 0
    };

    // Role Counts
    const roles = {
        'Batsman': 0,
        'Bowler': 0,
        'All Rounder': 0,
        'Wicket Keeper': 0
    };

    squadPlayers.forEach(p => {
        if (roles[p.role] !== undefined) roles[p.role]++;
    });

    // Heuristic Rules for Needs
    if (roles['Wicket Keeper'] === 0) advice.urgentNeeds.push('Wicket Keeper');
    if (roles['Bowler'] < 4) advice.urgentNeeds.push('Bowlers'); // Need at least 4-5 bowlers
    if (roles['Batsman'] < 4) advice.urgentNeeds.push('Batsmen');

    // Budget Strategy
    // Calculate REALISTIC Bid Limit
    const squadSize = 15; // Target squad size
    const slotsFilled = squadPlayers.length;
    const slotsRemaining = Math.max(1, squadSize - slotsFilled);

    // Purse Per Slot (PPS)
    const pps = team.purse_remaining / slotsRemaining;

    // Strategy
    if (slotsRemaining <= 3) {
        // End game: Spend it all if needed
        advice.message = "Final Phase: You can bid aggressively to fill final slots.";
        advice.suggestedBidLimit = team.purse_remaining * 0.8;
    } else if (pps > 10000000) { // > 1 Cr per slot
        advice.message = "Rich Purse: Go for marquee players.";
        // Can bid up to 3x PPS safely
        advice.suggestedBidLimit = pps * 2.5;
    } else if (pps < 2000000) { // < 20 Lakhs per slot - Critical
        advice.message = "Tight Budget: Target unsold/base price players only.";
        advice.suggestedBidLimit = pps * 1.2;
    } else {
        advice.message = "Balanced Strategy: Don't overspend early.";
        advice.suggestedBidLimit = pps * 1.8;
    }

    if (advice.urgentNeeds.length > 0) {
        advice.message = `Needs: ${advice.urgentNeeds.join(', ')}. Prioritize these.`;
    }

    return advice;
};
