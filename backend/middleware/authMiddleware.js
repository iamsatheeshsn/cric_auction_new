const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Expecting "Bearer <token>"

        if (!token) {
            return res.status(403).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Unauthorized: Invalid token' });
            }
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ message: 'Failed to authenticate token' });
    }
};

module.exports = { verifyToken };
