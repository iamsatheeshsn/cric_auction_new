import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiUser, FiActivity, FiList, FiFileText, FiMonitor, FiMapPin, FiCalendar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerInfoModal from '../components/PlayerInfoModal';
import { calculateWinProbability } from '../utils/AIModel';


const MatchScoring = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();

    const [fixture, setFixture] = useState(null);
    const [summary, setSummary] = useState(null);
    const [allBalls, setAllBalls] = useState([]);

    // Tab State
    const [activeTab, setActiveTab] = useState('scoring'); // scoring, scorecard, commentary, summary

    // Selection state
    const [strikerId, setStrikerId] = useState('');
    const [nonStrikerId, setNonStrikerId] = useState('');
    const [bowlerId, setBowlerId] = useState('');

    // Modals
    const [infoPlayer, setInfoPlayer] = useState(null);
    const [tossModalOpen, setTossModalOpen] = useState(false);
    const [tossData, setTossData] = useState({ winnerId: '', decision: 'Bat', totalOvers: 10 });

    const [wicketModalOpen, setWicketModalOpen] = useState(false);
    const [wicketData, setWicketData] = useState({
        type: 'Bowled',
        playerOutId: '',
        fielderId: '',
        newBatsmanId: '',
        runs: 0
    });

    const [ballConfirmOpen, setBallConfirmOpen] = useState(false);
    const [inningsBreakOpen, setInningsBreakOpen] = useState(false);
    const [declaredInnings, setDeclaredInnings] = useState(false);
    const [pendingBall, setPendingBall] = useState(null);
    const [extraInputVal, setExtraInputVal] = useState('');

    const [winProbability, setWinProbability] = useState(null); // { team: 'Name', percent: 50 }

    useEffect(() => {
        loadMatchData();
    }, [fixtureId]);

    const loadMatchData = async () => {
        try {
            const res = await api.get(`/score/match/${fixtureId}`);
            const fix = res.data.fixture;
            setFixture(fix);
            setSummary(res.data.summary);
            setAllBalls(res.data.balls || []);

            const balls = res.data.balls || [];
            if (balls.length > 0) {
                const lb = balls[balls.length - 1];
                if (!strikerId && lb.striker_id && !lb.is_wicket) setStrikerId(lb.striker_id);

                // --- Win Probability (Simple Heuristic) ---
                const winProb = calculateWinProbability(fix, balls, res.data.summary);
                setWinProbability(winProb);

                const currentInnings = fix.current_innings || 1;
                const innBalls = balls.filter(b => b.innings === currentInnings);
                if (innBalls.length > 0) {
                    const maxOver = Math.max(...innBalls.map(b => b.over_number));
                    const currentOverBalls = innBalls.filter(b => b.over_number === maxOver);
                    const legalCount = currentOverBalls.filter(b => b.extra_type !== 'Wide' && b.extra_type !== 'NoBall').length;

                    // If mid-over, preserve bowler
                    if (legalCount < 6 && !bowlerId && lb.bowler_id) {
                        setBowlerId(lb.bowler_id);
                    }
                }
            }

            if (fix.status === 'Scheduled') {
                setTossModalOpen(true);
            }
            return { fixture: fix, summary: res.data.summary, balls: res.data.balls || [] };
        } catch (error) {
            console.error(error);
            toast.error("Failed to load match data");
            return null;
        }
    };

    const handleTossSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/score/match/${fixtureId}/state`, {
                status: 'Live',
                toss_winner_id: tossData.winnerId,
                toss_decision: tossData.decision,
                current_innings: 1,
                total_overs: tossData.totalOvers
            });
            toast.success("Match Started!");
            setTossModalOpen(false);
            loadMatchData();
        } catch (error) {
            toast.error("Failed to start match");
        }
    };

    const handleWicketClick = () => {
        setWicketData({
            type: 'Bowled',
            playerOutId: strikerId,
            fielderId: '',
            newBatsmanId: '',
            runs: 0
        });
        setWicketModalOpen(true);
    };

    const confirmWicket = async (e) => {
        e.preventDefault();
        const finalPlayerOut = wicketData.playerOutId || strikerId;
        const details = { ...wicketData, playerOutId: finalPlayerOut };
        await executeRecordBall(parseInt(wicketData.runs) || 0, 0, 'None', true, details);
        setWicketModalOpen(false);
    };

    const initiateRecordBall = (runs, initialExtras = 0, extraType = 'None', requiresInput = false) => {
        if (!strikerId || !nonStrikerId || !bowlerId) {
            toast.error("Please select Striker, Non-Striker, and Bowler first.");
            return;
        }

        const payload = { runs, extras: initialExtras, extraType, isOut: false, wicketDetails: null, requiresInput };
        setPendingBall(payload);

        let defaultInput = 0;
        if (extraType === 'Wide' || extraType === 'Bye' || extraType === 'LegBye') defaultInput = 1;
        setExtraInputVal(defaultInput);

        setBallConfirmOpen(true);
    };

    const confirmBallRecording = async () => {
        if (pendingBall) {
            let finalRuns = pendingBall.runs;
            let finalExtras = pendingBall.extras;

            if (pendingBall.requiresInput) {
                const inputVal = parseInt(extraInputVal) || 0;
                if (pendingBall.extraType === 'NoBall') {
                    finalRuns = inputVal;
                } else if (pendingBall.extraType === 'Wide') {
                    finalExtras = inputVal;
                    finalRuns = 0;
                } else if (pendingBall.extraType === 'Bye' || pendingBall.extraType === 'LegBye') {
                    finalExtras = inputVal;
                    finalRuns = 0;
                }
            }

            await executeRecordBall(finalRuns, finalExtras, pendingBall.extraType, false, null);
            setBallConfirmOpen(false);
            setPendingBall(null);
        }
    };

    const executeRecordBall = async (runs, extras = 0, extraType = 'None', isOut = false, wicketDetails = null) => {
        try {
            let currentInnings = fixture.current_innings || 1;

            const inningsBalls = allBalls.filter(b => b.innings === currentInnings);
            let maxOver = 0;
            if (inningsBalls.length > 0) {
                maxOver = Math.max(...inningsBalls.map(b => b.over_number));
            }

            const currentOverBalls = inningsBalls.filter(b => b.over_number === maxOver);
            const legalBallsInfo = currentOverBalls.filter(b => b.extra_type !== 'Wide' && b.extra_type !== 'NoBall');

            let targetOver = maxOver;
            let targetBallNum = currentOverBalls.length + 1;
            let isOverChanger = false;

            if (legalBallsInfo.length >= 6) {
                targetOver = maxOver + 1;
                targetBallNum = 1;
            }

            const isValidDelivery = (extraType !== 'Wide' && extraType !== 'NoBall');

            // STRICT CHECK: Block if trying to start an over beyond the limit
            if (targetOver >= (fixture.total_overs || 20)) {
                // Check if it's actually match end (Innings 2)
                if (fixture.current_innings === 2) {
                    // Check status update?
                    // If status is NOT completed, maybe we need to run checkMatchStatus again?
                    // Or just return to let UI handle "Match Completed" view.
                    if (fixture.status === 'Completed') {
                        return; // UI will show Result
                    } else {
                        // Trigger check manually if somehow missed?
                        // But usually block is good.
                        // Let's just show a warning if status isn't updated yet.
                        // if (!isMatchCompleted) { // isMatchCompleted is not defined here
                        // Force check?
                        // logic is handled in checkMatchStatus which runs after every ball.
                        // If we are here, it means we are trying to record ball 1 of over 21. 
                        // So just Block.
                        // }
                    }
                }

                if (fixture.current_innings === 1) {
                    toast.warning("Innings Break");
                    // setInningsBreakOpen(true);
                } else {
                    toast.warning("Match Completed");
                }
                return;
            }

            if (!strikerId || !nonStrikerId || !bowlerId) {
                toast.error("Please select Striker, Non-Striker, and Bowler");
                return;
            }

            const payload = {
                innings: currentInnings,
                over_number: targetOver,
                ball_number: targetBallNum,
                striker_id: strikerId,
                non_striker_id: nonStrikerId,
                bowler_id: bowlerId,
                runs_scored: runs,
                extras: extras,
                extra_type: extraType,
                is_wicket: isOut
            };

            if (isOut && wicketDetails) {
                payload.wicket_type = wicketDetails.type;
                payload.player_out_id = wicketDetails.playerOutId || null;
                payload.fielder_id = wicketDetails.fielderId || null;
            }

            const res = await api.post(`/score/match/${fixtureId}/ball`, payload);

            if (isOut) toast.success("Wicket!");
            // else toast.success("Ball Recorded"); // Reduce noise

            // RELOAD and CHECK MATCH END
            const newData = await loadMatchData(); // This loads new balls
            if (newData) {
                // Check if match ended JUST NOW
                await checkMatchStatus(newData);
            }

            let shouldSwap = (runs % 2 !== 0);

            if (extraType === 'Wide') {
                // Wide = 1 extra. Wide + 1 run = 2 extras (Crossed). Wide + 4 = 5 extras (No Cross).
                // So if (extras - 1) is odd, they crossed.
                shouldSwap = ((extras - 1) % 2 !== 0);
            } else if (extraType === 'Bye' || extraType === 'LegBye') {
                // Runs are in extras. If extras is odd, they crossed.
                shouldSwap = (extras % 2 !== 0);
            }

            // New Over Logic
            let newLegalCount = legalBallsInfo.length;
            if (targetOver > maxOver) newLegalCount = 0;
            if (isValidDelivery) newLegalCount++;

            if (newLegalCount === 6) {
                if (targetOver === (fixture.total_overs || 20) - 1) {
                    if (currentInnings === 1) toast.success("Innings Break!");
                    else toast.success("Match Completed!");
                } else {
                    toast.info("End of Over");
                    isOverChanger = true;
                }
            }


            if (shouldSwap) {
                const temp = strikerId;
                setStrikerId(nonStrikerId);
                setNonStrikerId(temp);
            }

            if (isOverChanger && newLegalCount === 6 && targetOver < (fixture.total_overs || 20) - 1) {
                // Only prompt switch if NOT end of innings
                if (shouldSwap) {
                    const temp = nonStrikerId;
                    setNonStrikerId(strikerId);
                    setStrikerId(temp);
                } else {
                    const temp = strikerId;
                    setStrikerId(nonStrikerId);
                    setNonStrikerId(temp);
                }
                setBowlerId('');
                toast.info("Select New Bowler");
            }

            if (isOut) {
                const outId = wicketDetails?.playerOutId || strikerId;
                if (strikerId == outId) setStrikerId('');
                if (nonStrikerId == outId) setNonStrikerId('');
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to record ball");
        }
    };

    const checkMatchStatus = async (data) => {
        const { fixture: fix, summary: summ, balls } = data;

        if (fix.status === 'Completed') return;

        const isTeam1BattingFirst = fix.toss_decision === 'Bat' ? String(fix.toss_winner_id) === String(fix.team1_id) : String(fix.toss_winner_id) !== String(fix.team1_id);

        if (fix.current_innings === 1) {
            const currentWickets = summ.score1.wickets;
            const batTeam = isTeam1BattingFirst ? fix.Team1 : fix.Team2;
            const maxWicketsDynamic = Math.min(parseInt(batTeam?.players_per_team) || 11, batTeam?.Players?.length || 11) - 1;

            // Check All Out
            if (currentWickets >= maxWicketsDynamic) {
                await handleInningsBreak();
                return;
            }
        }

        if (fix.current_innings === 2) {
            const target = summ.score1.runs + 1;
            const currentRuns = summ.score2.runs;
            const currentWickets = summ.score2.wickets;
            const inn2Balls = balls.filter(b => b.innings === 2);
            // Legal balls check: only exclude Wides and NoBalls from count
            const legalBalls = inn2Balls.filter(b => b.extra_type !== 'Wide' && b.extra_type !== 'NoBall').length;
            const totalBallsPossible = (fix.total_overs || 20) * 6;

            let isMatchEnd = false;
            let resultDesc = '';
            let winnerId = null;

            // 1. Chasing Team Wins (Reached Target)
            if (currentRuns >= target) {
                isMatchEnd = true;
                // Determine Chasing Team
                // Chasing Team is the one batting in Innings 2.
                // We can find them by referencing current strikers usually, or logic from Toss.
                // Batting 2nd Team = (TossWin & Bowl) ? TossWinner : Other
                // OR (TossWin & Bat) ? Other : TossWinner

                const battingSecondTeamId = (fix.toss_decision === 'Bat' && fix.toss_winner_id === fix.team1_id) ? fix.team2_id :
                    (fix.toss_decision === 'Bowl' && fix.toss_winner_id === fix.team1_id) ? fix.team1_id :
                        (fix.toss_decision === 'Bat' && fix.toss_winner_id === fix.team2_id) ? fix.team1_id : fix.team2_id;

                const battingSecondTeamName = battingSecondTeamId === fix.Team1.id ? fix.Team1.name : fix.Team2.name;
                winnerId = battingSecondTeamId;
                const wicketsLeft = 10 - currentWickets;
                resultDesc = `${battingSecondTeamName} won by ${wicketsLeft} wickets`;
            }
            const batTeam2 = isTeam1BattingFirst ? fix.Team2 : fix.Team1;
            const maxWicketsDynamic2 = Math.min(parseInt(batTeam2?.players_per_team) || 11, batTeam2?.Players?.length || 11) - 1;

            // 2. Chasing Team Lost (All Out OR No Balls Left) AND Score < Target
            if (currentWickets >= maxWicketsDynamic2 || legalBalls >= totalBallsPossible) {
                isMatchEnd = true;
                if (currentRuns < summ.score1.runs) {
                    const runDiff = summ.score1.runs - currentRuns;

                    const battingFirstTeamId = (fix.toss_decision === 'Bat' && fix.toss_winner_id === fix.team1_id) ? fix.team1_id :
                        (fix.toss_decision === 'Bowl' && fix.toss_winner_id === fix.team1_id) ? fix.team2_id :
                            (fix.toss_decision === 'Bat' && fix.toss_winner_id === fix.team2_id) ? fix.team2_id : fix.team1_id;

                    const battingFirstTeamName = battingFirstTeamId === fix.Team1.id ? fix.Team1.name : fix.Team2.name;
                    winnerId = battingFirstTeamId;
                    resultDesc = `${battingFirstTeamName} won by ${runDiff} runs`;

                } else if (currentRuns === summ.score1.runs) {
                    resultDesc = "Match Tied";
                    winnerId = null;
                }
            }

            if (isMatchEnd) {
                await api.put(`/score/match/${fixtureId}/state`, {
                    status: 'Completed',
                    result_description: resultDesc,
                    winning_team_id: winnerId
                });

                // Update Local State Immediately for Instant UI
                setFixture(prev => ({
                    ...prev,
                    status: 'Completed',
                    result_description: resultDesc,
                    winning_team_id: winnerId
                }));

                toast.success("Match Completed! " + resultDesc);

                // Switch to Summary Tab immediately
                setActiveTab('summary');

                loadMatchData();
            }
        }
    };

    const startNextInnings = async () => {
        try {
            await api.put(`/score/match/${fixtureId}/state`, {
                current_innings: 2
            });
            // Clear selections
            setStrikerId('');
            setNonStrikerId('');
            setBowlerId('');
            setInningsBreakOpen(false);
            toast.success("2nd Innings Started!");
            loadMatchData();
        } catch (error) {
            toast.error("Failed to start next innings");
        }
    };


    const getPlayerName = (id) => {
        if (!id) return '';
        const p1 = fixture.Team1?.Players?.find(p => p.id == id);
        if (p1) return p1.name;
        const p2 = fixture.Team2?.Players?.find(p => p.id == id);
        if (p2) return p2.name;
        return 'Unknown';
    };

    const calculateWinProbability = (fix, balls, summ) => {
        if (!fix || fix.status !== 'Live' || parseInt(fix.current_innings) !== 2) return null;
        if (!summ || !summ.score1 || !summ.score2) return null;

        const target = summ.score1.runs + 1;
        const currentRuns = summ.score2.runs;
        const wicketsLost = summ.score2.wickets;
        const ballsBowled = balls.filter(b => parseInt(b.innings) === 2 && b.extra_type !== 'Wide' && b.extra_type !== 'NoBall').length;
        const totalBalls = (fix.total_overs || 20) * 6;
        const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
        const runsNeeded = Math.max(0, target - currentRuns);

        // Chasing Team
        // Use String comparison for IDs to be safe
        const isTeam1TossWinner = String(fix.toss_winner_id) === String(fix.team1_id);
        const tossDecision = fix.toss_decision;

        let chasingTeamId;
        if (tossDecision === 'Bat') {
            chasingTeamId = isTeam1TossWinner ? fix.team2_id : fix.team1_id;
        } else {
            chasingTeamId = isTeam1TossWinner ? fix.team1_id : fix.team2_id;
        }

        const isChasingTeam1 = String(chasingTeamId) === String(fix.team1_id);
        const chasingTeamName = isChasingTeam1 ? fix.Team1.name : fix.Team2.name;
        const defendingTeamName = isChasingTeam1 ? fix.Team2.name : fix.Team1.name;

        // Simple Heuristic Algorithm (Calculates prob for Chasing Team)
        // 1. Base on RRR
        const rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 99;
        let prob = 50;

        if (runsNeeded <= 0) return { team: chasingTeamName, percent: 100 };
        if (ballsRemaining <= 0) return { team: defendingTeamName, percent: 100 };

        // RRR Factor
        if (rrr < 6) prob += 20;
        else if (rrr < 8) prob += 10;
        else if (rrr > 12) prob -= 30;
        else if (rrr > 10) prob -= 15;

        // Wickets Factor
        const wicketsLeft = 10 - wicketsLost;
        if (wicketsLeft >= 8) prob += 10;
        else if (wicketsLeft <= 3) prob -= 30; // High pressure

        // Balls Factor
        if (ballsRemaining < 12 && runsNeeded > 25) prob -= 40; // Impossible finish

        // Clamp
        prob = Math.max(1, Math.min(99, prob));

        // Return the Favorite
        if (prob >= 50) {
            return { team: chasingTeamName, percent: Math.round(prob) };
        } else {
            return { team: defendingTeamName, percent: 100 - Math.round(prob) };
        }
    };

    // --- Stats Calculations ---
    const calculateBattingStats = (teamId, innings) => {
        if (!fixture) return [];
        const ballHistory = allBalls.filter(b => b.innings === innings);
        const teamPlayers = fixture.Team1.id === teamId ? fixture.Team1.Players : fixture.Team2.Players;

        // Find wickets to see who is out
        const wicketBalls = ballHistory.filter(b => b.is_wicket);

        return teamPlayers.map(player => {
            const played = ballHistory.filter(b => b.striker_id === player.id);
            if (played.length === 0 && !wicketBalls.find(w => w.player_out_id === player.id)) {
                // Determine if they are Not Out (currently batting) or DNB ?
                // For simplicity, return null if no involvement, handle usage in UI
                // But DNB should be listed?
                // Minimal: Return object.
            }

            const runs = played.reduce((sum, b) => sum + b.runs_scored, 0);
            const ballsFaced = played.filter(b => b.extra_type !== 'Wide').length; // Wides don't count as ball faces usually? Yes.
            const fours = played.filter(b => b.runs_scored === 4).length;
            const sixes = played.filter(b => b.runs_scored === 6).length;
            const sr = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';

            const wicket = wicketBalls.find(b => b.player_out_id === player.id);
            let status = 'not out';
            if (wicket) {
                status = `${wicket.wicket_type} ${wicket.fielder_id ? `(c ${getFielderName(wicket.fielder_id)})` : ''} b ${getBowlerName(wicket.bowler_id)}`;
            } else if (played.length > 0 || player.id === strikerId || player.id === nonStrikerId) {
                status = 'not out';
            } else {
                status = 'dnb';
            }

            return { player, runs, balls: ballsFaced, fours, sixes, sr, status };
        }).filter(s => s.status !== 'dnb' || s.runs > 0); // Show only if played or out
        // Or show all? Standard is show DNB separately.
    };

    const calculateBowlingStats = (teamId, innings) => {
        if (!fixture) return [];
        const ballHistory = allBalls.filter(b => b.innings === innings);
        const teamPlayers = fixture.Team1.id === teamId ? fixture.Team1.Players : fixture.Team2.Players; // Waiting, Bowling Team is OPPOSITE of Batting
        const bowlingTeamPlayers = fixture.Team1.id !== teamId ? fixture.Team1.Players : fixture.Team2.Players; // Assuming input is BATTING Innings Number

        // Bowling Stats are for the fielding team
        // Pass Batting Team ID to function?
        // Let's rely on innings.
    };

    const getStatsForInnings = (inn) => {
        if (!fixture) return { batting: [], bowling: [] };

        let battingTeam, bowlingTeam;
        const isTeam1BattingFirst = fixture.toss_decision === 'Bat' ? fixture.toss_winner_id === fixture.Team1.id : fixture.toss_winner_id !== fixture.Team1.id;

        if (inn === 1) {
            battingTeam = isTeam1BattingFirst ? fixture.Team1 : fixture.Team2;
            bowlingTeam = isTeam1BattingFirst ? fixture.Team2 : fixture.Team1;
        } else {
            battingTeam = isTeam1BattingFirst ? fixture.Team2 : fixture.Team1;
            bowlingTeam = isTeam1BattingFirst ? fixture.Team1 : fixture.Team2;
        }

        const balls = allBalls.filter(b => b.innings === inn);

        // Batting
        const batting = battingTeam.Players.map(p => {
            const played = balls.filter(b => b.striker_id === p.id);
            const runs = played.reduce((s, b) => s + b.runs_scored, 0);
            const bf = played.filter(b => b.extra_type !== 'Wide').length;
            const fours = played.filter(b => b.runs_scored === 4).length;
            const sixes = played.filter(b => b.runs_scored === 6).length;
            const sr = bf > 0 ? ((runs / bf) * 100).toFixed(1) : '0.0';

            const wicket = balls.find(b => b.is_wicket && b.player_out_id === p.id);
            let status = 'dnb';

            if (wicket) {
                const bowler = bowlingTeam.Players.find(bp => bp.id === wicket.bowler_id)?.name || 'Bowler';
                const fielder = wicket.fielder_id ? bowlingTeam.Players.find(fp => fp.id === wicket.fielder_id)?.name : null;

                if (wicket.wicket_type === 'Caught') {
                    if (wicket.fielder_id === wicket.bowler_id) {
                        status = `c & b ${bowler}`;
                    } else {
                        status = `c ${fielder || 'unknown'} b ${bowler}`;
                    }
                } else if (wicket.wicket_type === 'Stumped') {
                    status = `st ${fielder || 'unknown'} b ${bowler}`;
                } else if (wicket.wicket_type === 'Run Out') {
                    status = `run out (${fielder || 'unknown'})`;
                } else if (wicket.wicket_type === 'LBW') {
                    status = `lbw b ${bowler}`;
                } else if (wicket.wicket_type === 'Bowled') {
                    status = `b ${bowler}`;
                } else if (wicket.wicket_type === 'Hit Wicket') {
                    status = `hit wicket b ${bowler}`;
                } else {
                    // Default fallback
                    status = `b ${bowler}`;
                }
            } else if (played.length > 0 || p.id == strikerId || p.id == nonStrikerId) {
                status = 'not out';
            }

            return { ...p, runs, bf, fours, sixes, sr, status };
        }); // Return all players including DNB

        // Bowling
        const activeBowlerIds = [...new Set(balls.map(b => b.bowler_id))];
        const bowling = activeBowlerIds.map(bid => {
            const bPlayer = bowlingTeam.Players.find(p => p.id === bid);
            if (!bPlayer) return null;

            const bBalls = balls.filter(b => b.bowler_id === bid);
            const legal = bBalls.filter(b => b.extra_type !== 'Wide' && b.extra_type !== 'NoBall').length;
            const overs = Math.floor(legal / 6) + '.' + (legal % 6);
            const runs = bBalls.reduce((s, b) => s + b.runs_scored + (b.extra_type === 'Wide' || b.extra_type === 'NoBall' ? b.extras : 0), 0);
            const wickets = bBalls.filter(b => b.is_wicket && b.wicket_type !== 'Run Out').length;
            const econ = legal > 0 ? ((runs / legal) * 6).toFixed(2) : runs;

            return { ...bPlayer, overs, runs, wickets, econ };
        }).filter(Boolean);

        return { batting, bowling, battingTeam, bowlingTeam };
    };

    if (!fixture) return <Layout>Loading...</Layout>;

    // Helpers
    const isTossWinner = (id) => String(id) === String(fixture.toss_winner_id);
    let battingTeam, bowlingTeam;
    // Current live team calc
    if (fixture.current_innings === 1) {
        if (fixture.toss_decision === 'Bat') {
            battingTeam = isTossWinner(fixture.team1_id) ? fixture.Team1 : fixture.Team2;
            bowlingTeam = isTossWinner(fixture.team1_id) ? fixture.Team2 : fixture.Team1;
        } else {
            battingTeam = isTossWinner(fixture.team1_id) ? fixture.Team2 : fixture.Team1;
            bowlingTeam = isTossWinner(fixture.team1_id) ? fixture.Team1 : fixture.Team2;
        }
    } else {
        if (fixture.toss_decision === 'Bat') {
            battingTeam = isTossWinner(fixture.team1_id) ? fixture.Team2 : fixture.Team1;
            bowlingTeam = isTossWinner(fixture.team1_id) ? fixture.Team1 : fixture.Team2;
        } else {
            battingTeam = isTossWinner(fixture.team1_id) ? fixture.Team1 : fixture.Team2;
            bowlingTeam = isTossWinner(fixture.team1_id) ? fixture.Team2 : fixture.Team1;
        }
    }

    const currentScore = fixture.current_innings === 1 ? summary?.score1 : summary?.score2;
    const outPlayerIds = allBalls.filter(b => b.is_wicket && b.player_out_id).map(b => b.player_out_id);
    const inning1Stats = getStatsForInnings(1);
    const inning2Stats = getStatsForInnings(2);

    // --- Logic for Restricted Bowler (Consecutive Overs) ---
    const currentInningsBalls = allBalls.filter(b => b.innings === (fixture.current_innings || 1));
    const currentMaxOver = currentInningsBalls.length > 0 ? Math.max(...currentInningsBalls.map(b => b.over_number)) : -1;
    const ballsInCurrentOver = currentInningsBalls.filter(b => b.over_number === currentMaxOver);
    const legalBallsInCurrentOver = ballsInCurrentOver.filter(b => b.extra_type !== 'Wide' && b.extra_type !== 'NoBall').length;
    const isNewOverPending = (legalBallsInCurrentOver >= 6);
    const lastBowlerId = (isNewOverPending && ballsInCurrentOver.length > 0) ? ballsInCurrentOver[0].bowler_id : null;

    // Derived State for Innings Break
    const totalOvers = fixture.total_overs || 20;
    const currentOversFloat = parseFloat(currentScore?.overs || 0);

    const maxWickets = Math.min(parseInt(battingTeam?.players_per_team) || 11, battingTeam?.Players?.length || 11) - 1;
    const isAllOut = (currentScore?.wickets || 0) >= maxWickets;

    // Check if target chased in 2nd innings
    const target = (summary?.score1?.runs || 0) + 1;
    const isTargetChased = (fixture.current_innings === 2 && (currentScore?.runs || 0) >= target);

    const isMaxOversReached = (currentMaxOver >= totalOvers - 1) && (legalBallsInCurrentOver >= 6);

    // Innings is ended if Overs done OR All Out OR (2nd Innings & Target Chased) OR Declared
    const isInningsEnded = (fixture.current_innings === 1 && (isMaxOversReached || isAllOut || declaredInnings));
    const isMatchCompleted = (fixture.status === 'Completed') || (fixture.current_innings === 2 && (isMaxOversReached || isAllOut || isTargetChased || declaredInnings));

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/60?text=None';
        if (path.startsWith('http')) return path; // Already absolute

        const normalizedPath = path.toString().replace(/\\/g, '/');
        // Ensure path starts with / if it doesn't
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    // Correctly map scores to Teams based on who batted first
    const isTeam1BattingFirst = fixture.toss_decision === 'Bat' ? isTossWinner(fixture.team1_id) : !isTossWinner(fixture.team1_id);

    // If Team 1 batted first, their score is score1. If Team 2 batted first, Team 1's score is score2.
    const team1Score = isTeam1BattingFirst ? summary?.score1 : summary?.score2;
    const team2Score = isTeam1BattingFirst ? summary?.score2 : summary?.score1;

    // --- Enhanced Commentary Logic ---
    const commentaryTimeline = (() => {
        if (!allBalls || allBalls.length === 0) return [];

        const timeline = [];
        // Sort Oldest First for calculation
        const sortedBalls = [...allBalls].sort((a, b) => {
            if (a.innings !== b.innings) return a.innings - b.innings;
            if (a.over_number !== b.over_number) return a.over_number - b.over_number;
            return a.ball_number - b.ball_number;
        });

        let state = {
            1: { runs: 0, wickets: 0 },
            2: { runs: 0, wickets: 0 },
            batsmen: {}, // { id: { runs, balls, fours, sixes } }
            bowlers: {}  // { id: { runs, wickets, balls } }
        };

        const getBat = (id) => state.batsmen[id] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
        const getBowl = (id) => state.bowlers[id] || { runs: 0, wickets: 0, balls: 0 };

        let currentOverRuns = 0;

        sortedBalls.forEach((ball, index) => {
            const inn = ball.innings;
            const totalRuns = ball.runs_scored + ball.extras;

            // Score
            state[inn].runs += totalRuns;
            if (ball.is_wicket) state[inn].wickets += 1;

            // Batsmen
            if (ball.striker_id) {
                let s = getBat(ball.striker_id);
                s.runs += ball.runs_scored;
                if (ball.extra_type !== 'Wide') s.balls += 1;
                if (ball.runs_scored === 4) s.fours += 1;
                if (ball.runs_scored === 6) s.sixes += 1;
                state.batsmen[ball.striker_id] = s;
            }

            // Bowler
            if (ball.bowler_id) {
                let b = getBowl(ball.bowler_id);
                if (ball.extra_type !== 'Bye' && ball.extra_type !== 'LegBye') b.runs += totalRuns;
                if (ball.extra_type !== 'Wide' && ball.extra_type !== 'NoBall') b.balls += 1;
                if (ball.is_wicket && ball.wicket_type !== 'Run Out') b.wickets += 1;
                state.bowlers[ball.bowler_id] = b;
            }

            currentOverRuns += totalRuns;

            // Add Ball to Timeline
            timeline.push({ type: 'ball', data: ball });

            // Check End of Over
            const nextBall = sortedBalls[index + 1];
            const isOverEnd = !nextBall || nextBall.over_number !== ball.over_number; // Ball-based over change
            const isInningsChange = !nextBall || nextBall.innings !== inn; // Innings boundary

            if (isOverEnd || isInningsChange) {
                const battingTeamId = inn === 1 ? (isTeam1BattingFirst ? fixture.team1_id : fixture.team2_id) : (isTeam1BattingFirst ? fixture.team2_id : fixture.team1_id);
                const battingTeamName = battingTeamId === fixture.Team1.id ? fixture.Team1.name : fixture.Team2.name;

                const oversDone = ball.over_number + 1;
                const crr = (state[inn].runs / oversDone).toFixed(2);
                let rrr = null;
                let equation = null;

                if (inn === 2) {
                    const targetScore = (summary?.score1?.runs || 0) + 1;
                    const runsNeeded = Math.max(0, targetScore - state[inn].runs);
                    const oversRemaining = (fixture.total_overs || 20) - oversDone;
                    if (oversRemaining > 0) {
                        rrr = (runsNeeded / oversRemaining).toFixed(2);
                        equation = `Need ${runsNeeded} runs from ${oversRemaining * 6}b`;
                    }
                }

                // Snapshots
                const striker = { ...getBat(ball.striker_id), name: getPlayerName(ball.striker_id) };
                const nonStriker = { ...getBat(ball.non_striker_id), name: getPlayerName(ball.non_striker_id) };

                const bowlerStats = getBowl(ball.bowler_id);
                const bOvers = Math.floor(bowlerStats.balls / 6) + '.' + (bowlerStats.balls % 6);

                const summaryCard = {
                    type: 'summary',
                    overNumber: ball.over_number + 1,
                    runsInOver: currentOverRuns,
                    battingTeam: battingTeamName,
                    score: `${state[inn].runs}/${state[inn].wickets}`,
                    crr,
                    rrr,
                    equation,
                    striker,
                    nonStriker,
                    bowler: {
                        name: getPlayerName(ball.bowler_id),
                        figures: `${bOvers}-0-${bowlerStats.runs}-${bowlerStats.wickets}`
                    }
                };

                // Logic: 
                // 1. If Innings Change -> Add Partition.
                // 2. If Innings Change AND All Out -> Check if we skip Summary.
                //    User says: "If team gets All Out in the over then no need to display 'End of Over 1'".
                //    Implies we SKIP summary if All Out (wickets >= 10 usually).

                const battingTeamObj = battingTeamId === fixture.Team1.id ? fixture.Team1 : fixture.Team2;
                const maxWickets = (parseInt(battingTeamObj?.players_per_team) || 11) - 1;
                const isAllOut = state[inn].wickets >= maxWickets;

                if (isAllOut) {
                    // If All Out, SKIP summary card entirely (per user request)
                    // But ALWAYS add innings break if it actually triggered innings change (or if All Out IS the change)
                    timeline.push({
                        type: 'innings_break',
                        innings: inn,
                        text: `End of ${inn === 1 ? '1st' : '2nd'} Innings`,
                        team: battingTeamName,
                        score: `${state[inn].runs}/${state[inn].wickets}`,
                        target: inn === 1 ? state[inn].runs + 1 : null
                    });
                } else {
                    // Normal behavior
                    timeline.push(summaryCard);

                    if (isInningsChange) {
                        timeline.push({
                            type: 'innings_break',
                            innings: inn,
                            text: `End of ${inn === 1 ? '1st' : '2nd'} Innings`,
                            team: battingTeamName,
                            score: `${state[inn].runs}/${state[inn].wickets}`,
                            target: inn === 1 ? state[inn].runs + 1 : null
                        });
                    }
                }

                currentOverRuns = 0;
            }
        });

        return timeline.reverse();
    })();

    const currentBattingTeamName = fixture.current_innings === 1
        ? (isTeam1BattingFirst ? fixture.Team1?.name : fixture.Team2?.name)
        : (isTeam1BattingFirst ? fixture.Team2?.name : fixture.Team1?.name);


    return (
        <Layout>
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600">
                        <FiArrowLeft /> Back
                    </button>
                    <div className="text-right">
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-2 items-center">
                                <Link to={`/broadcast/${fixtureId}`} target="_blank" className="flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-md text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm mr-2" title="Open Broadcast View for OBS">
                                    <FiMonitor /> Stream
                                </Link>
                                <Link to={`/match-analytics/${fixtureId}`} target="_blank" className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm mr-2" title="View Advanced Analytics">
                                    <FiActivity /> Analytics
                                </Link>
                                <span className="text-sm font-bold text-gray-500">Target: {fixture.total_overs && `${fixture.total_overs} Overs`}</span>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${fixture.status === 'Live' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                                    {fixture.status?.toUpperCase() || 'UNKNOWN'}
                                </div>
                            </div>
                            {winProbability && (
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md shadow-sm text-xs font-bold flex items-center gap-2">
                                    <FiActivity />
                                    <span>{winProbability.team} Win: {winProbability.percent}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center text-center">
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-50 overflow-hidden mb-3 border border-gray-100 shadow-sm">
                        <img
                            key={fixture.Team1?.id}
                            src={getImageUrl(fixture.Team1?.image_path || fixture.Team1?.logo_url || fixture.Team1?.image)}
                            alt={fixture.Team1?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/60?text=' + (fixture.Team1?.short_name || 'T1');
                            }}
                        />
                    </div>
                    <h2 className={`text-2xl font-bold ${battingTeam?.id == fixture.Team1?.id ? 'text-deep-blue' : 'text-gray-800'}`}>{fixture.Team1?.name}</h2>
                    <p className={`text-4xl font-black my-2 ${battingTeam?.id == fixture.Team1?.id ? 'text-gray-900' : 'text-gray-400'}`}>
                        {team1Score?.runs}/{team1Score?.wickets}
                    </p>
                    <p className="text-gray-500 text-sm">Overs: {team1Score?.overs}</p>
                </div>
                <div className="text-gray-300 text-2xl font-bold px-4">VS</div>
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-50 overflow-hidden mb-3 border border-gray-100 shadow-sm">
                        <img
                            src={getImageUrl(fixture.Team2?.image_path || fixture.Team2?.logo_url || fixture.Team2?.image)}
                            alt={fixture.Team2?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=' + (fixture.Team2?.short_name || 'T2')}
                        />
                    </div>
                    <h2 className={`text-2xl font-bold ${battingTeam?.id == fixture.Team2?.id ? 'text-deep-blue' : 'text-gray-800'}`}>{fixture.Team2?.name}</h2>
                    <p className={`text-4xl font-black my-2 ${battingTeam?.id == fixture.Team2?.id ? 'text-gray-900' : 'text-gray-400'}`}>
                        {team2Score?.runs}/{team2Score?.wickets}
                    </p>
                    <p className="text-gray-500 text-sm">Overs: {team2Score?.overs}</p>
                </div>
            </div>


            {/* Tabs */}
            < div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 flex overflow-hidden" >
                {
                    ['scoring', 'scorecard', 'commentary', 'summary'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 font-bold text-center capitalize transition-colors ${activeTab === tab ? 'bg-deep-blue text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {tab}
                        </button>
                    ))
                }
            </div >

            {/* Main Content Area */}
            < div className="min-h-[500px]" >
                {activeTab === 'scoring' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Selection (Hide or Disable if Innings Ended?) -> Let's keep it visible but maybe disabled or just leave it */}
                        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit ${isInningsEnded ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><FiUser /> Batters ({battingTeam?.short_name})</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Striker</label>
                                    <div className="flex items-center gap-3">
                                        {strikerId && (() => {
                                            const p = battingTeam?.Players?.find(pl => pl.id == strikerId);
                                            return p ? (
                                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getImageUrl(p.image_path || p.image_url || p.image)}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=' + p.name.charAt(0)}
                                                    />
                                                </div>
                                            ) : null;
                                        })()}
                                        <select value={strikerId} onChange={e => setStrikerId(e.target.value)} className="w-full p-2 border rounded-lg bg-yellow-50 border-yellow-200 text-gray-800 font-bold focus:ring-2 focus:ring-yellow-400 outline-none">
                                            <option value="">Select Striker</option>
                                            {battingTeam?.Players?.filter(p => !outPlayerIds.includes(p.id)).map(p => (
                                                <option key={p.id} value={p.id} disabled={p.id == nonStrikerId}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Non-Striker</label>
                                    <div className="flex items-center gap-3">
                                        {nonStrikerId && (() => {
                                            const p = battingTeam?.Players?.find(pl => pl.id == nonStrikerId);
                                            return p ? (
                                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getImageUrl(p.image_path || p.image_url || p.image)}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=' + p.name.charAt(0)}
                                                    />
                                                </div>
                                            ) : null;
                                        })()}
                                        <select value={nonStrikerId} onChange={e => setNonStrikerId(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-gray-200 outline-none">
                                            <option value="">Select Non-Striker</option>
                                            {battingTeam?.Players?.filter(p => !outPlayerIds.includes(p.id)).map(p => (
                                                <option key={p.id} value={p.id} disabled={p.id == strikerId}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><FiActivity /> Bowler ({bowlingTeam?.short_name})</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Current Bowler</label>
                                        <div className="flex items-center gap-3">
                                            {bowlerId && (() => {
                                                const p = bowlingTeam?.Players?.find(pl => pl.id == bowlerId);
                                                return p ? (
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={getImageUrl(p.image_path || p.image_url || p.image)}
                                                            alt={p.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=' + p.name.charAt(0)}
                                                        />
                                                    </div>
                                                ) : null;
                                            })()}
                                            <select value={bowlerId} onChange={e => setBowlerId(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none">
                                                <option value="">Select Bowler</option>
                                                {bowlingTeam?.Players?.map(p => (
                                                    <option key={p.id} value={p.id} disabled={p.id == lastBowlerId}>
                                                        {p.name} {p.id == lastBowlerId ? '(Finished Over)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Score Pad OR Innings Break UI */}
                        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                            {(isInningsEnded || isMatchCompleted) ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-6 animate-fadeIn">
                                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl shadow-inner">
                                        <FiMonitor />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-gray-800">
                                            {isMatchCompleted ? "Match Completed" : "Innings Break"}
                                        </h3>
                                        <p className="text-gray-500 mt-2 text-lg">
                                            {isMatchCompleted ? (
                                                <span className="font-bold text-green-600">{fixture.result_description}</span>
                                            ) : (
                                                <>
                                                    {battingTeam?.name} finished at <span className="font-bold text-gray-900">{summary?.score1?.runs}/{summary?.score1?.wickets}</span>
                                                </>
                                            )}
                                        </p>
                                        {!isMatchCompleted && <p className="text-gray-400 mt-1">Target: {summary?.score1?.runs + 1}</p>}
                                    </div>

                                    {isMatchCompleted ? (
                                        <button
                                            onClick={() => setActiveTab('summary')}
                                            className="px-8 py-4 bg-deep-blue text-white font-bold text-xl rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-900 hover:scale-105 transition-all"
                                        >
                                            View Summary
                                        </button>
                                    ) : (
                                        <button
                                            onClick={startNextInnings}
                                            className="px-8 py-4 bg-deep-blue text-white font-bold text-xl rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-900 hover:scale-105 transition-all"
                                        >
                                            Start 2nd Innings
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-bold text-gray-700 mb-4">Record Delivery <span className="text-sm font-normal text-gray-400 ml-2">(Over {currentScore?.overs || '0.0'})</span></h3>
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        {[0, 1, 2, 3, 4, 6].map(run => (
                                            <button key={run} onClick={() => initiateRecordBall(run)} className="aspect-square rounded-xl bg-slate-50 border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-3xl font-black text-slate-700 transition-all shadow-sm active:scale-95 flex items-center justify-center">
                                                {run}
                                            </button>
                                        ))}
                                        <button onClick={handleWicketClick} className="aspect-square rounded-xl bg-red-50 border-2 border-red-100 hover:border-red-500 hover:bg-red-100 text-2xl font-bold text-red-600 transition-all flex items-center justify-center">OUT</button>
                                        <button onClick={() => initiateRecordBall(0, 1, 'Wide', true)} className="aspect-square rounded-xl bg-orange-50 border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-100 text-2xl font-bold text-orange-600 transition-all flex items-center justify-center">WD</button>
                                    </div>



                                    <div className="grid grid-cols-3 gap-4">
                                        <button onClick={() => initiateRecordBall(0, 1, 'NoBall', true)} className="py-4 rounded-lg bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition-colors">No Ball</button>
                                        <button onClick={() => initiateRecordBall(0, 1, 'Bye', true)} className="py-4 rounded-lg bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition-colors">Bye</button>
                                        <button onClick={() => initiateRecordBall(0, 1, 'LegBye', true)} className="py-4 rounded-lg bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition-colors">Leg Bye</button>
                                    </div>

                                    {!isMatchCompleted && (
                                        <div className="mt-6 border-t border-gray-100 pt-4">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to DECLARE/END the ${fixture.current_innings === 1 ? '1st' : '2nd'} innings?`)) {
                                                        setDeclaredInnings(true);
                                                    }
                                                }}
                                                className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FiMonitor /> {fixture.current_innings === 1 ? "Declare / End Innings" : "End Match"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {
                    activeTab === 'scorecard' && (
                        <div className="space-y-6">
                            {[{ inn: 1, stats: inning1Stats }, { inn: 2, stats: inning2Stats }].map(({ inn, stats }) => {
                                const battedPlayers = stats.batting.filter(p => p.status !== 'dnb');
                                const dnbPlayers = stats.batting.filter(p => p.status === 'dnb');

                                return (
                                    <div key={inn} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="font-bold text-lg text-gray-800">{stats.battingTeam?.name} Innings</h3>
                                            <span className="font-mono font-bold text-gray-600">
                                                {inn === 1 ? summary?.score1?.runs : summary?.score2?.runs}/{inn === 1 ? summary?.score1?.wickets : summary?.score2?.wickets}
                                                ({inn === 1 ? summary?.score1?.overs : summary?.score2?.overs} Ov)
                                            </span>
                                        </div>
                                        <div className="p-6">
                                            {/* Batting Table */}
                                            <table className="w-full text-sm mb-6">
                                                <thead>
                                                    <tr className="border-b text-gray-400 text-left">
                                                        <th className="py-2">Batter</th>
                                                        <th className="py-2">Status</th>
                                                        <th className="py-2 text-right">R</th>
                                                        <th className="py-2 text-right">B</th>
                                                        <th className="py-2 text-right">4s</th>
                                                        <th className="py-2 text-right">6s</th>
                                                        <th className="py-2 text-right">SR</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {battedPlayers.map(p => (
                                                        <tr key={p.id} className="border-b border-gray-50 text-gray-700">
                                                            <td className="py-2 font-bold flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                                    <img
                                                                        src={getImageUrl(p.image_path || p.image_url || p.image)}
                                                                        alt={p.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=' + p.name.charAt(0)}
                                                                    />
                                                                </div>
                                                                <span className="cursor-pointer hover:text-blue-600 font-bold" onClick={() => setInfoPlayer(p)}>{p.name}</span>
                                                            </td>
                                                            <td className="py-2 text-gray-500 text-xs">{p.status}</td>
                                                            <td className="py-2 text-right font-bold">{p.runs}</td>
                                                            <td className="py-2 text-right">{p.bf}</td>
                                                            <td className="py-2 text-right">{p.fours}</td>
                                                            <td className="py-2 text-right">{p.sixes}</td>
                                                            <td className="py-2 text-right">{p.sr}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* Did Not Bat List */}
                                            {dnbPlayers.length > 0 && (
                                                <div className="text-sm text-gray-600 mb-6">
                                                    <span className="font-bold">Did not bat: </span>
                                                    {dnbPlayers.map((p, i) => (
                                                        <span key={p.id}>
                                                            <span className="cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setInfoPlayer(p)}>{p.name}</span>
                                                            {i < dnbPlayers.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Bowling Table */}
                                            <h4 className="font-bold text-gray-600 mb-2 text-xs uppercase">Bowling</h4>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-gray-400 text-left">
                                                        <th className="py-2">Bowler</th>
                                                        <th className="py-2 text-right">O</th>
                                                        <th className="py-2 text-right">M</th>
                                                        <th className="py-2 text-right">R</th>
                                                        <th className="py-2 text-right">W</th>
                                                        <th className="py-2 text-right">Eco</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stats.bowling.map(p => (
                                                        <tr key={p.id} className="border-b border-gray-50 text-gray-700">
                                                            <td className="py-2 font-bold flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                                    <img
                                                                        src={getImageUrl(p.image_path || p.image_url || p.image)}
                                                                        alt={p.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=' + p.name.charAt(0)}
                                                                    />
                                                                </div>
                                                                <span className="cursor-pointer hover:text-blue-600 font-bold" onClick={() => setInfoPlayer(p)}>{p.name}</span>
                                                            </td>
                                                            <td className="py-2 text-right">{p.overs}</td>
                                                            <td className="py-2 text-right">0</td>
                                                            <td className="py-2 text-right">{p.runs}</td>
                                                            <td className="py-2 text-right font-bold">{p.wickets}</td>
                                                            <td className="py-2 text-right">{p.econ}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                }

                {
                    activeTab === 'commentary' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                                <h3 className="font-bold text-gray-700">Commentary</h3>
                                <div className="text-sm font-bold text-deep-blue">
                                    Batting: {currentBattingTeamName}
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {commentaryTimeline.map((item, index) => {
                                    if (item.type === 'innings_break') {
                                        return (
                                            <div key={`break-${index}`} className="bg-deep-blue text-white p-4 text-center">
                                                <h4 className="font-black text-lg uppercase tracking-wide mb-1">{item.text}</h4>
                                                <p className="text-sm font-bold opacity-90">{item.team}: {item.score}</p>
                                                {item.target && <p className="text-xs mt-2 font-mono bg-white/20 inline-block px-3 py-1 rounded-full">Target: {item.target}</p>}
                                            </div>
                                        );
                                    } else if (item.type === 'summary') {
                                        return (
                                            <div key={`summary-${index}`} className="bg-blue-50/50 p-4 border-y border-blue-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider">End of Over {item.overNumber}</h4>
                                                    <span className="font-black text-xl text-deep-blue">{item.runsInOver} runs</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-3 text-sm">
                                                    <span className="font-bold text-gray-600">{item.battingTeam}: {item.score}</span>
                                                    <div className="flex gap-3 text-gray-500 text-xs">
                                                        <span>CRR: {item.crr}</span>
                                                        {item.rrr && <span>• RRR: {item.rrr}</span>}
                                                        {item.equation && <span>• {item.equation}</span>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm bg-white p-3 rounded-lg border border-gray-100">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between font-bold text-gray-800">
                                                            <span>{item.striker.name}</span>
                                                            <span>{item.striker.runs} ({item.striker.balls}b)</span>
                                                        </div>
                                                        <div className="flex justify-between text-gray-500">
                                                            <span>{item.nonStriker.name}</span>
                                                            <span>{item.nonStriker.runs} ({item.nonStriker.balls}b)</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right border-l pl-4 border-gray-100 flex flex-col justify-center">
                                                        <div className="font-bold text-gray-800">{item.bowler.name}</div>
                                                        <div className="text-gray-500 text-xs">{item.bowler.figures}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const ball = item.data;
                                        const allPlayers = [...(fixture.Team1?.Players || []), ...(fixture.Team2?.Players || [])];
                                        const bowler = allPlayers.find(p => p.id === ball.bowler_id);

                                        const bowlerName = bowler?.name || getPlayerName(ball.bowler_id);
                                        const strikerName = getPlayerName(ball.striker_id);
                                        const totalRuns = ball.runs_scored + ball.extras;

                                        let commText = `${bowlerName} to ${strikerName}, ${totalRuns} runs`;
                                        if (ball.extra_type !== 'None') commText += ` (${ball.extra_type})`; // Simplified text
                                        if (ball.runs_scored === 4) commText = `${bowlerName} to ${strikerName}, FOUR runs!`;
                                        if (ball.runs_scored === 6) commText = `${bowlerName} to ${strikerName}, SIX! High and handsome!`;

                                        if (ball.is_wicket) {
                                            commText = `${bowlerName} to ${strikerName}, OUT! ${ball.wicket_type}`;
                                            if (['Caught', 'Run Out', 'Stumped'].includes(ball.wicket_type) && ball.fielder_id) {
                                                commText += ` by ${getPlayerName(ball.fielder_id)}`;
                                            }
                                        }
                                        if (ball.commentary) commText = ball.commentary; // custom override

                                        let rowClass = "p-4 transition-colors flex gap-4 border-b border-gray-100";
                                        if (ball.is_wicket) rowClass += " bg-red-50";
                                        else if (ball.runs_scored === 4) rowClass += " bg-blue-50";
                                        else if (ball.runs_scored === 6) rowClass += " bg-purple-50";
                                        else rowClass += " hover:bg-gray-50 bg-white";

                                        return (
                                            <div key={ball.id} className={rowClass}>
                                                <div className="text-gray-900 font-mono font-bold w-12 text-sm pt-1">{ball.over_number}.{ball.ball_number}</div>
                                                {/* Avatar */}
                                                <div className="hidden sm:block">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={getImageUrl(bowler?.image_path || bowler?.image_url || bowler?.image)}
                                                            alt={bowlerName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=' + (bowlerName?.charAt(0) || 'B')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-800">{commText}</div>
                                                    {/* Auto-gen text if custom empty? */}
                                                    {!ball.commentary && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {ball.runs_scored === 4 ? 'Boundary to the fence.' : ball.runs_scored === 6 ? 'Maximum!' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    {ball.runs_scored === 4 && <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold w-fit border border-blue-200">FOUR</div>}
                                                    {ball.runs_scored === 6 && <div className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold w-fit border border-purple-200">SIX</div>}
                                                    {ball.is_wicket && <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold w-fit border border-red-200">OUT</div>}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'summary' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                            <h2 className="text-3xl font-black text-gray-800 mb-2">Match Summary</h2>
                            <div className="flex items-center justify-center gap-4 text-gray-500 mb-8 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <FiMapPin className="text-gray-400" />
                                    <span>{fixture.venue}</span>
                                </div>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <div className="flex items-center gap-1.5">
                                    <FiCalendar className="text-gray-400" />
                                    <span>{new Date(fixture.match_date).toDateString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                                <div className="p-6 bg-blue-50 rounded-2xl flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-full bg-white overflow-hidden mb-4 border border-blue-100 shadow-md">
                                        <img
                                            src={getImageUrl(fixture.Team1?.image_path || fixture.Team1?.logo_url || fixture.Team1?.image)}
                                            alt={fixture.Team1?.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=' + (fixture.Team1?.short_name || 'T1')}
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-deep-blue mb-2">{fixture.Team1?.name}</h3>
                                    <p className="text-3xl font-black">{team1Score?.runs}/{team1Score?.wickets}</p>
                                    <p className="text-gray-500">{team1Score?.overs} Overs</p>
                                </div>
                                <div className="p-6 bg-yellow-50 rounded-2xl flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-full bg-white overflow-hidden mb-4 border border-yellow-100 shadow-md">
                                        <img
                                            src={getImageUrl(fixture.Team2?.image_path || fixture.Team2?.logo_url || fixture.Team2?.image)}
                                            alt={fixture.Team2?.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=' + (fixture.Team2?.short_name || 'T2')}
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-yellow-700 mb-2">{fixture.Team2?.name}</h3>
                                    <p className="text-3xl font-black">{team2Score?.runs}/{team2Score?.wickets}</p>
                                    <p className="text-gray-500">{team2Score?.overs} Overs</p>
                                </div>
                            </div>

                            <div className="mt-12">
                                <h4 className="font-bold text-gray-400 uppercase text-sm mb-4">Result</h4>
                                {(() => {
                                    let resultText = fixture.result_description;

                                    if (fixture.status === 'Completed' && !resultText && summary) {
                                        // Fallback Check in UI
                                        const target = summary.score1.runs + 1;
                                        const currentRuns = summary.score2.runs;
                                        const currentWickets = summary.score2.wickets;

                                        // Check Winner
                                        if (currentRuns >= target) {
                                            // Batting 2nd Won
                                            const battingSecondTeamId = (fixture.toss_decision === 'Bat' && fixture.toss_winner_id === fixture.team1_id) ? fixture.team2_id :
                                                (fixture.toss_decision === 'Bowl' && fixture.toss_winner_id === fixture.team1_id) ? fixture.team1_id :
                                                    (fixture.toss_decision === 'Bat' && fixture.toss_winner_id === fixture.team2_id) ? fixture.team1_id : fixture.team2_id;

                                            const battingSecondTeamName = battingSecondTeamId === fixture.Team1.id ? fixture.Team1.name : fixture.Team2.name;
                                            const wicketsLeft = 10 - currentWickets;
                                            resultText = `${battingSecondTeamName} won by ${wicketsLeft} wickets`;
                                        } else {
                                            // Batting 1st Won (or Tie)
                                            if (currentRuns < summary.score1.runs) {
                                                const runDiff = summary.score1.runs - currentRuns;
                                                const battingFirstTeamId = (fixture.toss_decision === 'Bat' && fixture.toss_winner_id === fixture.team1_id) ? fixture.team1_id :
                                                    (fixture.toss_decision === 'Bowl' && fixture.toss_winner_id === fixture.team1_id) ? fixture.team2_id :
                                                        (fixture.toss_decision === 'Bat' && fixture.toss_winner_id === fixture.team2_id) ? fixture.team2_id : fixture.team1_id;

                                                const battingFirstTeamName = battingFirstTeamId === fixture.Team1.id ? fixture.Team1.name : fixture.Team2.name;
                                                resultText = `${battingFirstTeamName} won by ${runDiff} runs`;
                                            } else {
                                                resultText = "Match Tied";
                                            }
                                        }
                                    }

                                    return fixture.status === 'Completed' ? (
                                        <p className="text-2xl font-bold text-green-600">{resultText || 'Match Completed'}</p>
                                    ) : (
                                        <p className="text-xl font-bold text-blue-500 animate-pulse">Match in Progress</p>
                                    );
                                })()}
                            </div>

                            {/* Player of the Match Display */}
                            {fixture.status === 'Completed' && fixture.player_of_match_id && (
                                <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 flex flex-col items-center">
                                    <h5 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2">Player of the Match</h5>
                                    {(() => {
                                        const allPlayers = [
                                            ...(fixture.Team1?.Players || []),
                                            ...(fixture.Team2?.Players || [])
                                        ];
                                        const potm = allPlayers.find(p => p.id === fixture.player_of_match_id);

                                        return potm ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-white border-2 border-yellow-400 overflow-hidden shadow-sm">
                                                    <img
                                                        src={getImageUrl(potm.image_path || potm.image)}
                                                        alt={potm.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=' + potm.name.charAt(0)}
                                                    />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-lg font-black text-gray-800">{potm.name}</p>
                                                    <p className="text-sm font-bold text-gray-500">{potm.role || 'Player'}</p>
                                                </div>
                                            </div>
                                        ) : <p className="text-sm font-medium text-gray-500">Player data loading...</p>;
                                    })()}
                                </div>
                            )}
                        </div>
                    )
                }
            </div >

            {/* Modals ... (Confirm, Toss, Wicket - Same as before) */}
            < AnimatePresence >
                {tossModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100"><h3 className="text-xl font-bold">Match Setup</h3></div>
                            <form onSubmit={handleTossSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Toss Winner</label>
                                    <select required className="w-full p-2 border rounded-lg" value={tossData.winnerId} onChange={e => setTossData({ ...tossData, winnerId: e.target.value })}>
                                        <option value="">Select Winner</option>
                                        <option value={fixture.team1_id}>{fixture.Team1?.name}</option>
                                        <option value={fixture.team2_id}>{fixture.Team2?.name}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Decision</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-3 border rounded-lg text-center cursor-pointer transition-colors ${tossData.decision === 'Bat' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>
                                            <input type="radio" name="decision" value="Bat" checked={tossData.decision === 'Bat'} onChange={() => setTossData({ ...tossData, decision: 'Bat' })} className="hidden" />
                                            Bat
                                        </label>
                                        <label className={`flex-1 p-3 border rounded-lg text-center cursor-pointer transition-colors ${tossData.decision === 'Bowl' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>
                                            <input type="radio" name="decision" value="Bowl" checked={tossData.decision === 'Bowl'} onChange={() => setTossData({ ...tossData, decision: 'Bowl' })} className="hidden" />
                                            Bowl
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Total Overs</label>
                                        <input
                                            type="number"
                                            min="1" max="50"
                                            className="w-full p-2 border rounded-lg font-bold"
                                            value={tossData.totalOvers}
                                            onChange={e => setTossData({ ...tossData, totalOvers: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-deep-blue text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors mt-4">Start Match</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            <ConfirmationModal
                isOpen={ballConfirmOpen}
                onClose={() => setBallConfirmOpen(false)}
                onConfirm={confirmBallRecording}
                title={`Record ${pendingBall?.extraType !== 'None' ? pendingBall?.extraType : 'Delivery'}`}
                message={
                    pendingBall?.requiresInput ? (
                        <div className="space-y-2 text-left">
                            <p className="text-gray-500 text-center mb-2">Enter {pendingBall?.extraType === 'NoBall' ? 'Runs scored off Bat' : `Number of ${pendingBall?.extraType}s`}:</p>
                            <input
                                type="number"
                                className="w-full p-4 text-center text-3xl font-bold border rounded-xl"
                                value={extraInputVal}
                                onChange={e => setExtraInputVal(e.target.value)}
                                autoFocus
                            />
                        </div>
                    ) : (
                        `Record ${pendingBall?.runs} ${pendingBall?.extraType !== 'None' ? `(${pendingBall?.extraType})` : 'Runs'}?`
                    )
                }
                confirmText={pendingBall?.requiresInput ? "Confirm" : "Record"}
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            />

            <AnimatePresence>
                {wicketModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-red-50">
                                <h3 className="text-xl font-bold text-red-600">Wicket Breakdown</h3>
                            </div>
                            <form onSubmit={confirmWicket} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Wicket Type</label>
                                    <select className="w-full p-2 border rounded-lg" value={wicketData.type} onChange={e => setWicketData({ ...wicketData, type: e.target.value })}>
                                        <option value="Bowled">Bowled</option>
                                        <option value="Caught">Caught</option>
                                        <option value="LBW">LBW</option>
                                        <option value="Run Out">Run Out</option>
                                        <option value="Stumped">Stumped</option>
                                        <option value="Hit Wicket">Hit Wicket</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Batsman Out</label>
                                    <select className="w-full p-2 border rounded-lg" value={wicketData.playerOutId} onChange={e => setWicketData({ ...wicketData, playerOutId: e.target.value })}>
                                        <option value="">Select Batsman</option>
                                        {battingTeam?.Players?.filter(p => !outPlayerIds.includes(p.id) || p.id == strikerId || p.id == nonStrikerId).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {['Caught', 'Run Out', 'Stumped'].includes(wicketData.type) && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Fielder / Catcher</label>
                                        <select className="w-full p-2 border rounded-lg" value={wicketData.fielderId} onChange={e => setWicketData({ ...wicketData, fielderId: e.target.value })}>
                                            <option value="">Select Fielder</option>
                                            {bowlingTeam?.Players?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Runs Scored (Run Out / Wide+Stump)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full p-2 border rounded-lg font-bold"
                                        value={wicketData.runs}
                                        onChange={e => setWicketData({ ...wicketData, runs: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">Confirm Wicket</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Innings Break Modal - REMOVED, Handled in Scoring Tab inline */}
            {/* Player Info Modal */}
            <PlayerInfoModal
                player={infoPlayer}
                isOpen={!!infoPlayer}
                onClose={() => setInfoPlayer(null)}
            />
        </Layout >
    );
};

export default MatchScoring;
