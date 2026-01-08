const { ScoreBall, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getPlayerStats = async (playerId, fixtureIds = null) => {
    try {
        const statsFilter = fixtureIds ? { fixture_id: { [Op.in]: fixtureIds } } : {};

        const matches = await ScoreBall.count({
            distinct: true,
            col: 'fixture_id',
            where: {
                [Op.or]: [{ striker_id: playerId }, { bowler_id: playerId }],
                ...statsFilter
            }
        });

        const runs = await ScoreBall.sum('runs_scored', {
            where: { striker_id: playerId, ...statsFilter }
        }) || 0;

        const wickets = await ScoreBall.count({
            where: {
                bowler_id: playerId,
                is_wicket: true,
                wicket_type: { [Op.ne]: 'Run Out' },
                ...statsFilter
            }
        });

        const balls_faced = await ScoreBall.count({
            where: {
                striker_id: playerId,
                extra_type: { [Op.ne]: 'Wide' },
                ...statsFilter
            }
        });

        const outs = await ScoreBall.count({
            where: { player_out_id: playerId, ...statsFilter }
        });

        const balls_bowled = await ScoreBall.count({
            where: {
                bowler_id: playerId,
                extra_type: { [Op.and]: [{ [Op.ne]: 'Wide' }, { [Op.ne]: 'NoBall' }] },
                ...statsFilter
            }
        });

        const rc_result = await ScoreBall.findAll({
            attributes: [[sequelize.literal('SUM(runs_scored + extras)'), 'total']],
            where: {
                bowler_id: playerId,
                ...statsFilter
            }
        });
        const runs_conceded = rc_result[0]?.dataValues.total || 0;

        return {
            matches,
            runs,
            wickets,
            balls_faced,
            outs,
            balls_bowled,
            runs_conceded
        };

    } catch (error) {
        console.error(`Error calculating stats for player ${playerId}:`, error);
        return { matches: 0, runs: 0, wickets: 0 };
    }
};
