const { Player } = require('./models');
const { sequelize } = require('./models');

(async () => {
    try {
        const player = await Player.findOne({ where: { image_path: { [require('sequelize').Op.ne]: null } } });
        if (player) {
            console.log("Image Path:", player.image_path);
        } else {
            console.log("No player with image found.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
})();
