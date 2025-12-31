const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');

console.log("Auth Routes Type:", typeof authRoutes);
console.log("Player Routes Stack:", playerRoutes.stack ? playerRoutes.stack.length : 'No Stack');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/fixtures', require('./routes/fixtureRoutes'));
app.use('/api/score', require('./routes/scoreRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/points', require('./routes/pointsRoutes')); // Did I make this? No, I made tournamentRoutes. Remove if error.
app.use('/api/tournament', require('./routes/tournamentRoutes'));

app.get('/', (req, res) => {
    res.send('Cricket Auction API is running...');
});

app.get('/api/test', (req, res) => {
    res.send('Test Route Working');
});

// Standard Start
sequelize.sync({ alter: true }).then(() => {
    console.log('Database connected & Models synced!');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        const listEndpoints = require('express-list-endpoints');
        console.log("--- Registered Routes ---");
        try {
            console.log(listEndpoints(app));
        } catch (e) {
            console.log("Could not list endpoints:", e);
        }
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
