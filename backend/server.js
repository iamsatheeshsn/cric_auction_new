const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

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
const fanRoutes = require('./routes/fanRoutes');
app.use('/api/fan', fanRoutes);

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
app.use('/api/points', require('./routes/pointsRoutes'));
app.use('/api/tournament', require('./routes/tournamentRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/shortlist', require('./routes/shortlistRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/fan', fanRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/watchlist', require('./routes/watchlistRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));

app.get('/', (req, res) => {
    res.send('Cricket Auction API is running...');
});

app.get('/api/test', (req, res) => {
    res.send('Test Route Working');
});

// Standard Start
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now, tighten for prod
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Make io accessible to our router
app.set('io', io);

const { Message, User } = require('./models');

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join Room
    socket.on('join_room', async (room) => {
        // Room can be 'auction_{id}' or 'match_{id}'
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Chat Message
    socket.on('send_message', async (data) => {
        // data: { auctionId, userId, content, username, type, fixtureId }
        try {
            const type = data.type || 'auction_room';
            const fixtureId = data.fixtureId || null;

            const newMsg = await Message.create({
                auction_id: data.auctionId,
                user_id: data.userId,
                content: data.content,
                type: type,
                fixture_id: fixtureId
            });
            // Fetch actual user details to ensure data consistency
            const sender = await User.findByPk(data.userId);

            // Include user info for display
            const msgToSend = {
                ...newMsg.toJSON(),
                User: {
                    username: sender?.username || 'Unknown',
                    display_name: sender?.display_name || sender?.username || 'User'
                }
            };

            const room = type === 'match_center' ? `match_${fixtureId}` : `auction_${data.auctionId}`;
            io.to(room).emit('receive_message', msgToSend);
        } catch (err) {
            console.error("Msg Error:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// sequelize.sync({ alter: false }).then(() => {
console.log('Database connected & Models dummy-synced!');
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    const listEndpoints = require('express-list-endpoints');
    console.log("--- Registered Routes ---");
    try {
        console.log(listEndpoints(app));
    } catch (e) {
        console.log("Could not list endpoints:", e);
    }
});
// }).catch(err => {
//     console.error('Unable to connect to the database:', err);
// });
