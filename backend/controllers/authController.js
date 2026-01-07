const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
require('dotenv').config();

exports.login = async (req, res) => {
    try {
        console.log("Login Request Body:", req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            console.log("Missing username or password");
            return res.status(400).json({ message: 'Missing credentials' });
        }

        console.log(`Attempting login for: ${username}`);

        // Find user
        const user = await User.findOne({ where: { username } });
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('User found. stored hash:', user.password);
        console.log('Checking password...');

        // Check password (In real app use bcrypt.compare, here simple check if we seeded plain text or hash)
        // For this demo, we assume the first admin is created manually or via seed with a known password.
        // Let's implement proper comparison assuming we will seed a hashed password.
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const newUser = await User.create({
            username,
            password: hashedPassword,
            role: role || 'admin'
        });

        res.status(201).json({ message: 'User created successfully', userId: newUser.id });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify Old Password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        // Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update User
        user.password = hashedPassword;
        await user.save();

        const { logActivity } = require('../utils/activityLogger');
        await logActivity(user.id, "Changed Password", "User changed their password");

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: 'Error updating password' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        let { userId, display_name, avatar } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'Missing userId' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.file) {
            // Construct the full URL for the uploaded file
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            avatar = `${baseUrl}/uploads/${req.file.filename}`;
        }

        user.display_name = display_name || user.display_name;
        // Only update avatar if a new one is provided (either file or url string)
        if (avatar) {
            user.avatar = avatar;
        }

        await user.save();

        const { logActivity } = require('../utils/activityLogger');
        await logActivity(user.id, "Updated Profile", "User updated their profile details");

        res.json({
            message: 'Profile updated',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};
