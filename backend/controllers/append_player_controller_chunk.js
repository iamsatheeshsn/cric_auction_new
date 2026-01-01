
// Bulk Import Players
exports.createPlayersBulk = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { auction_id } = req.body;
        const results = [];
        const { AuctionPlayer, Player } = require('../models');

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    let importedCount = 0;

                    // Pre-fetch max order_id if auction_id is present
                    let currentMaxOrder = 0;
                    if (auction_id) {
                        currentMaxOrder = await AuctionPlayer.max('order_id', { where: { auction_id } }) || 0;
                    }

                    for (const row of results) {
                        try {
                            const {
                                name, mobile_number, role, batting_type, bowling_type,
                                father_name, dob, tshirt_size, trouser_size, notes,
                                points, jersey_no
                            } = row;

                            // Create Global Player
                            const player = await Player.create({
                                name: name,
                                mobile_number: mobile_number,
                                role: role || 'All Rounder',
                                batting_type: batting_type || 'Right Hand',
                                bowling_type: bowling_type || 'None',
                                father_name: father_name,
                                dob: dob || null,
                                tshirt_size: tshirt_size,
                                trouser_size: trouser_size,
                                notes: notes,
                                preferred_jersey_no: jersey_no
                            });

                            // Link to Auction
                            if (auction_id && player) {
                                currentMaxOrder++;
                                await AuctionPlayer.create({
                                    auction_id: auction_id,
                                    player_id: player.id,
                                    order_id: currentMaxOrder,
                                    status: 'Available',
                                    points: points || 0, // Base points
                                    is_owner: 'false'
                                });
                            }
                            importedCount++;
                        } catch (err) {
                            console.error("Error importing row:", row, err);
                            // Continue to next row even if one fails
                        }
                    }

                    // Cleanup uploaded file
                    fs.unlinkSync(req.file.path);

                    res.json({ message: `Successfully imported ${importedCount} players.` });

                } catch (internalError) {
                    console.error("Error processing CSV:", internalError);
                    res.status(500).json({ message: 'Error processing CSV file' });
                }
            });

    } catch (error) {
        console.error("Error in bulk import:", error);
        res.status(500).json({ message: 'Error initiating bulk import' });
    }
};
