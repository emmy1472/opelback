/**
 * Catalog and scraper API routes
 */
const express = require('express');
const scraper = require('../scraper');
const { VehicleModel, VehicleSpec, VehicleCatalog, VehiclePart, SearchHistory } = require('../models');
const { optionalAuth } = require('../auth');
const { validateVin, validateQueryUrl } = require('../utils/validators');
const config = require('../config');

const router = express.Router();

// Get all vehicle models
router.get('/models', async (req, res) => {
    try {
        let models = await VehicleModel.find({}, '-_id name url image').lean();
        if (models.length === 0) {
            console.log('[CATALOG] No models in cache, scraping...');
            try {
                models = await scraper.getGlobalModels();
                if (models.length > 0) {
                    await VehicleModel.insertMany(models, { ordered: false }).catch(e => null);
                }
            } catch (err) {
                console.warn('[CATALOG] Scraping failed:', err.message);
                models = [];
            }
        }
        res.json(models);
    } catch (error) {
        console.error('[CATALOG] Models error:', error.message);
        res.json([]);
    }
});

// Get vehicle specs
router.get('/specs', async (req, res) => {
    const { url } = req.query;
    if (!url || !validateQueryUrl(url)) {
        return res.status(400).json({ error: 'Valid URL parameter is required' });
    }
    
    try {
        let specs = await VehicleSpec.find({ parentUrl: url }, '-_id year engine transmission url').lean();
        
        if (specs.length === 0) {
            const modelMatch = url.match(/global\/([^\/-]+)/);
            if (modelMatch) {
                specs = await VehicleSpec.find(
                    { parentUrl: { $regex: modelMatch[1] } },
                    '-_id year engine transmission url'
                ).lean();
            }
        }
        
        if (specs.length === 0) {
            try {
                specs = await scraper.getVehicleSpecs(url);
                if (specs.length > 0) {
                    const toSave = specs.map(s => ({ ...s, parentUrl: url }));
                    await VehicleSpec.insertMany(toSave, { ordered: false }).catch(e => null);
                }
            } catch (err) {
                console.warn('[CATALOG] Specs scraping failed');
                specs = [];
            }
        }
        res.json(specs);
    } catch (error) {
        console.error('[CATALOG] Specs error:', error.message);
        res.json([]);
    }
});

// Get model catalog
router.get('/catalog', async (req, res) => {
    const { url } = req.query;
    if (!url || !validateQueryUrl(url)) {
        return res.status(400).json({ error: 'Valid URL parameter is required' });
    }
    
    try {
        const modelMatch = url.match(/global\/([^\/]+)/);
        const modelSlug = modelMatch ? modelMatch[1] : 'unknown';
        
        let categories = await VehicleCatalog.find({ parentUrl: url }, '-_id name url').lean();
        
        if (categories.length === 0 && modelSlug !== 'unknown') {
            categories = await VehicleCatalog.find(
                { parentUrl: { $regex: modelSlug } },
                '-_id name url'
            ).limit(config.CACHE_LIMIT).lean();
        }
        
        if (categories.length === 0) {
            try {
                categories = await scraper.getModelCatalog(url);
                if (categories.length > 0) {
                    const toSave = categories.map(c => ({ ...c, parentUrl: url }));
                    await VehicleCatalog.insertMany(toSave, { ordered: false }).catch(e => null);
                }
            } catch (err) {
                console.warn('[CATALOG] Scraping failed');
                categories = [];
            }
        }
        res.json(categories);
    } catch (error) {
        console.error('[CATALOG] Catalog error:', error.message);
        res.json([]);
    }
});

// Get parts
router.get('/parts', async (req, res) => {
    const { url } = req.query;
    if (!url || !validateQueryUrl(url)) {
        return res.status(400).json({ error: 'Valid URL parameter is required' });
    }
    
    try {
        let parts = await VehiclePart.find({ parentUrl: url }, '-_id name number url').lean();
        
        if (parts.length === 0) {
            const categoryMatch = url.match(/#([^/]+)/);
            if (categoryMatch) {
                parts = await VehiclePart.find(
                    { parentUrl: { $regex: categoryMatch[1] } },
                    '-_id name number url'
                ).limit(50).lean();
            }
        }
        
        if (parts.length === 0) {
            try {
                parts = await scraper.getCategoryParts(url);
                if (parts.length > 0) {
                    const toSave = parts.map(p => ({ ...p, parentUrl: url }));
                    await VehiclePart.insertMany(toSave, { ordered: false }).catch(e => null);
                }
            } catch (err) {
                console.warn('[CATALOG] Parts scraping failed');
                parts = [];
            }
        }
        res.json(parts);
    } catch (error) {
        console.error('[CATALOG] Parts error:', error.message);
        res.json([]);
    }
});

// VIN lookup
router.post('/vin-lookup', optionalAuth, async (req, res) => {
    const { vin } = req.body;
    if (!validateVin(vin)) {
        return res.status(400).json({ error: 'Valid 17-digit VIN is required' });
    }
    
    try {
        const result = await scraper.searchByVin(vin);

        if (req.user && result.found) {
            try {
                await SearchHistory.create({
                    userId: req.user.id,
                    vin: vin.toUpperCase(),
                    modelName: result.name || ''
                });
            } catch (e) {
                console.error('[CATALOG] Search history save error');
            }
        }

        res.json(result);
    } catch (error) {
        console.error('[CATALOG] VIN lookup error:', error.message);
        res.json({ found: false, message: 'VIN lookup temporarily unavailable. Try again later.' });
    }
});

module.exports = router;
