/**
 * Authentication routes
 */
const express = require('express');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../auth');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');
const config = require('../config');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!validateUsername(username) || !validateEmail(email) || !validatePassword(password)) {
            return res.status(400).json({ error: 'Invalid input. All fields are required with proper formatting.' });
        }

        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
            return res.status(400).json({ error: `This ${field} is already registered` });
        }

        const user = new User({ username, email: email.toLowerCase(), password });
        await user.save();

        const token = generateToken(user);
        res.status(201).json({
            token,
            user: {
                id: user.userId,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('[AUTH] Register error:', error.message);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user.userId,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.userId,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('[AUTH] Get user error:', error.message);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Get search history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const SearchHistory = require('../models/SearchHistory');
        const history = await SearchHistory.find({ userId: req.user.id })
            .sort({ searchedAt: -1 })
            .limit(config.MAX_HISTORY_RECORDS);
        res.json(history);
    } catch (error) {
        console.error('[AUTH] History error:', error.message);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

module.exports = router;
