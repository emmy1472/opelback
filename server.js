require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./db');
const config = require('./config');

// Route imports
const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        version: '1.0.2',
        platform: process.platform,
        node: process.version,
        timestamp: new Date().toISOString(),
        mongoConnected: !!mongoose.connection.readyState
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[SERVER] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(config.PORT, () => {
    console.log(`[SERVER] Running on port ${config.PORT} (${config.NODE_ENV})`);
});

module.exports = app;