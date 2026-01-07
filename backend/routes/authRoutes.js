const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log("Loading Auth Routes...");
const upload = require('../middleware/upload');
router.post('/login', (req, res, next) => {
    console.log("Login route hit!");
    next();
}, authController.login);
// Secure route would be better, but for MVP open register is fine or protected by middleware
router.post('/register', authController.register);
router.post('/change-password', authController.changePassword);
router.post('/update-profile', upload.single('avatar'), authController.updateProfile);

module.exports = router;
