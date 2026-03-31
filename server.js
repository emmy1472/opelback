require('dotenv').config();
// Force rebuild - v1.0.2 (Made all scrapers resilient with fallback empty arrays - 2026-03-31 01:45)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const scraper = require('./scraper');
const connectDB = require('./db');
const User = require('./models/User');
const SearchHistory = require('./models/SearchHistory');
const VehicleModel = require('./models/VehicleModel');
const VehicleSpec = require('./models/VehicleSpec');
const VehicleCatalog = require('./models/VehicleCatalog');
const VehiclePart = require('./models/VehiclePart');
const { generateToken, authMiddleware, optionalAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        version: '1.0.1',
        platform: process.platform,
        node: process.version,
        timestamp: new Date().toISOString(),
        mongoConnected: !!mongoose.connection.readyState
    });
});

// ═══════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check existing
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
            return res.status(400).json({ error: `This ${field} is already registered` });
        }

        const user = new User({ username, email, password });
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
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
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
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Get search history
app.get('/api/auth/history', authMiddleware, async (req, res) => {
    try {
        const history = await SearchHistory.find({ userId: req.user.id })
            .sort({ searchedAt: -1 })
            .limit(50);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get history' });
    }
});

// ═══════════════════════════════════════════════
//  IMAGE PROXY
// ═══════════════════════════════════════════════

app.get('/api/image-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    if (!url.includes('7zap.com') && !url.includes('img.')) {
        return res.status(403).json({ error: 'Only image URLs are allowed' });
    }
    
    console.log(`[IMAGE PROXY] Fetching: ${url.substring(0, 80)}`);
    
    try {
        const { execSync } = require('child_process');
        const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // Use curl with Cloudflare bypass headers and cookie jar
        const command = `curl.exe -A "${USER_AGENT}" -L "${url}" --max-time 30 --compressed -H "Accept: image/*" -H "Referer: https://7zap.com/" -c nul -b ""`;
        const imageBuffer = execSync(command, {
            encoding: 'buffer',
            maxBuffer: 1024 * 1024 * 50,
            timeout: 35000
        });
        
        const ext = url.split('.').pop().split('?')[0].toLowerCase();
        const mimeTypes = { 
            webp: 'image/webp', 
            png: 'image/png', 
            jpg: 'image/jpeg', 
            jpeg: 'image/jpeg', 
            gif: 'image/gif', 
            svg: 'image/svg+xml',
            bmp: 'image/bmp',
            avif: 'image/avif'
        };
        
        res.set('Content-Type', mimeTypes[ext] || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=604800');
        res.send(imageBuffer);
        console.log(`[IMAGE PROXY] ✅ Success (${imageBuffer.length} bytes)`);
    } catch (error) {
        console.error(`[IMAGE PROXY ERROR] ${error.message}`);
        // Return JSON error response instead of fallback pixel
        // This is more useful for debugging Cloudflare issues
        res.status(502).json({ 
            error: 'Failed to fetch image',
            message: error.message,
            reason: 'Image server may be behind Cloudflare or temporarily unavailable',
            url: url,
            note: '7zap.com uses Cloudflare WAF which blocks automated requests. Images can be accessed through browser-based requests with Cloudflare cookie challenges.'
        });
    }
});

// ═══════════════════════════════════════════════
//  CACHED SCRAPER API ENDPOINTS
// ═══════════════════════════════════════════════

app.get('/api/models', async (req, res) => {
    try {
        let models = await VehicleModel.find({}, '-_id name url image').lean();
        if (models.length === 0) {
            console.log('No models in cache, scraping...');
            models = await scraper.getGlobalModels();
            if (models.length > 0) {
                await VehicleModel.insertMany(models, { ordered: false }).catch(e => console.error('Duplicate insertion ignored'));
            }
        }
        res.json(models);
    } catch (error) {
        console.error('API /models error:', error.message);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

app.get('/api/specs', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    try {
        let specs = await VehicleSpec.find({ parentUrl: url }, '-_id year engine transmission url').lean();
        if (specs.length === 0) {
            console.log('[API] No specs in cache, attempting scrape...');
            try {
                specs = await scraper.getVehicleSpecs(url);
                if (specs.length > 0) {
                    const toSave = specs.map(s => ({ ...s, parentUrl: url }));
                    await VehicleSpec.insertMany(toSave, { ordered: false }).catch(e => console.error('Duplicate insertion ignored'));
                }
            } catch (scrapeError) {
                console.warn('[API] ⚠️ Specs scraping failed:', scrapeError.message);
                specs = [];
            }
        }
        res.json(specs);
    } catch (error) {
        console.error('[API] Unexpected /specs error:', error.message);
        res.json([]);
    }
});

app.get('/api/catalog', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    try {
        console.log(`[API] /catalog request for: ${url.substring(0, 80)}`);
        
        // Step 1: Try to get from cache
        let categories = await VehicleCatalog.find({ parentUrl: url }, '-_id name url').lean();
        
        // Step 2: If nothing in cache, try to scrape
        if (categories.length === 0) {
            console.log('[API] No catalog in cache, attempting scrape...');
            try {
                categories = await scraper.getModelCatalog(url);
                console.log(`[API] Scraper returned ${categories.length} categories`);
                
                // Save to cache if we got results
                if (categories.length > 0) {
                    const toSave = categories.map(c => ({ ...c, parentUrl: url }));
                    await VehicleCatalog.insertMany(toSave, { ordered: false }).catch(e => console.error('Duplicate insertion ignored'));
                    console.log(`[API] ✅ Cached ${categories.length} categories`);
                }
            } catch (scrapeError) {
                console.warn('[API] ⚠️ Scraping failed:', scrapeError.message);
                // Don't fail - return empty array which will trigger fallback on frontend
                categories = [];
            }
        } else {
            console.log(`[API] ✅ Found ${categories.length} categories in cache`);
        }
        
        // Step 3: Always return SOMETHING (never return 500 error)
        res.json(categories); // Will be [] if scrape failed, which is ok
        
    } catch (error) {
        console.error('[API] ❌ Unexpected /catalog error:', error.message);
        // Even on unexpected error, return empty array instead of 500
        res.json([]);
    }
});

app.get('/api/parts', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    try {
        let parts = await VehiclePart.find({ parentUrl: url }, '-_id name number url').lean();
        if (parts.length === 0) {
            console.log('[API] No parts in cache, attempting scrape...');
            try {
                parts = await scraper.getCategoryParts(url);
                if (parts.length > 0) {
                    const toSave = parts.map(p => ({ ...p, parentUrl: url }));
                    await VehiclePart.insertMany(toSave, { ordered: false }).catch(e => console.error('Duplicate insertion ignored'));
                }
            } catch (scrapeError) {
                console.warn('[API] ⚠️ Parts scraping failed:', scrapeError.message);
                parts = [];
            }
        }
        res.json(parts);
    } catch (error) {
        console.error('[API] Unexpected /parts error:', error.message);
        res.json([]);
    }
});

app.post('/api/vin-lookup', optionalAuth, async (req, res) => {
    const { vin } = req.body;
    if (!vin || vin.length !== 17) {
        return res.status(400).json({ error: 'Valid 17-digit VIN is required' });
    }
    try {
        const result = await scraper.searchByVin(vin);

        // Save to search history if user is logged in
        if (req.user && result.found) {
            try {
                await SearchHistory.create({
                    userId: req.user.id,
                    vin: vin.toUpperCase(),
                    modelName: result.name || ''
                });
            } catch (e) {
                console.error('Failed to save search history:', e.message);
            }
        }

        res.json(result);
    } catch (error) {
        const msg = error.message || '';
        if (msg.includes('Network error') || msg.includes('Could not resolve host')) {
            return res.json({
                found: false,
                message: 'Cannot connect to the parts database. Please check your internet connection and try again.'
            });
        }
        res.status(500).json({ error: 'VIN lookup failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
