
const templates = {
    0: [
        "Defended solidly back to the bowler.",
        "Good length, no run.",
        "Beaten! Lovely bowling.",
        "Straight to the fielder at point, no run.",
        "Leaves that one alone.",
        "Defensive push, finds the fielder.",
        "Swing and a miss!",
        "Solid defence."
    ],
    1: [
        "Pushed into the gap for a single.",
        "Just a quick single.",
        "Trabbs it to third man for one.",
        "Driven to long-on for a single.",
        "Leg glance, easy single.",
        "Dropped in front of point, quick run taken."
    ],
    2: [
        "Punched through the covers, they'll come back for two.",
        "Good running, that's two runs.",
        "Worked away to deep mid-wicket for a couple.",
        "Misfield allows the second run."
    ],
    3: [
        "Great placement! They run three hard.",
        "Stopped just inside the boundary! Three runs saved."
    ],
    4: [
        "FOUR! Cracking shot through the covers!",
        "FOUR! Pulled away disdainfully to the fence.",
        "FOUR! Edged but it flies past the slip cordon!",
        "FOUR! Straight down the ground, lovely timing.",
        "FOUR! Swept away fine for a boundary.",
        "What a shot! Finds the gap perfectly for FOUR."
    ],
    6: [
        "SIX! That's huge! Out of the ground!",
        "SIX! Picked the slower one and deposited it into the stands.",
        "SIX! Massive blow over long-on!",
        "SIX! Clean strike, sails over the bowler's head.",
        "Boom! SIX runs immediately off the bat.",
        "High and handsome! That is a MAXIMUM!"
    ],
    Wicket: [
        "OUT! Clean bowled! The stumps are swaying!",
        "OUT! Caught! Straight down the throat of the fielder.",
        "OUT! Edged and gone! The keeper makes no mistake.",
        "OUT! LBW! Plumb in front, up goes the finger!",
        "OUT! Run out! Mix up in the middle and he's gone.",
        "Gone! The big wicket falls!"
    ],
    Wide: [
        "Wide ball, slips down the leg side.",
        "Way outside off, called a Wide.",
        "Too high, signaled Wide/No-ball." // Simplified
    ],
    NoBall: [
        "No Ball! Overstepping the line.",
        "No Ball! Beamer implies a free hit next."
    ]
};

const getRandomTemplate = (list) => {
    return list[Math.floor(Math.random() * list.length)];
};

exports.generateCommentary = (ballData, context = {}) => {
    const { runs_scored, is_wicket, wicket_type, extra_type, extras } = ballData;
    const { strikerName, bowlerName } = context;

    let text = "";

    // Priority: Wicket > Boundaries > Extras > Runs
    if (is_wicket) {
        text = getRandomTemplate(templates.Wicket);
        if (wicket_type && wicket_type !== 'Run Out') {
            // Inject names if possible, simplistic replace if generic, or append
            if (strikerName) text = text.replace("Player", strikerName); // If template had placeholder
            text += ` ${strikerName} has to walk back.`;
        }
    } else if (runs_scored === 6) {
        text = getRandomTemplate(templates[6]);
    } else if (runs_scored === 4) {
        text = getRandomTemplate(templates[4]);
    } else if (extra_type === 'Wide') {
        text = getRandomTemplate(templates.Wide);
    } else if (extra_type === 'NoBall') {
        text = getRandomTemplate(templates.NoBall);
    } else {
        // 0, 1, 2, 3
        const list = templates[runs_scored] || [`${runs_scored} runs.`];
        text = getRandomTemplate(list);
    }

    // Context Injection (Smart Stuff)
    // E.g. "What a shot by Kohli!"
    if (strikerName && (runs_scored >= 4 || is_wicket)) {
        // Simple appendage for now or we could use placeholders in templates
        // Let's keep it simple: The templates stand alone well.
    }

    return text;
};

exports.generateOverSummary = (overData) => {
    // overData: { over_number, runs, wickets, total_score, wickets_down }
    const { over_number, runs, wickets, total_score, wickets_down } = overData;
    return `End of Over ${over_number + 1}. ${runs} runs, ${wickets} wickets. Score: ${total_score}/${wickets_down}.`;
};
