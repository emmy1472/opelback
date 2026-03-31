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

// Scraped Parts API Routes (Database queries for frontend)

/**
 * GET /api/scraped-parts/models
 * Get list of all models that have been scraped
 */
router.get('/scraped-parts/models', async (req, res) => {
    try {
        const models = await VehicleModel.find({}, 'name').distinct('name').lean();
        
        // If no scraped parts yet, return empty
        if (models.length === 0) {
            return res.json({ models: [] });
        }

        res.json({ models });
    } catch (error) {
        console.error('[CATALOG] Scraped models error:', error.message);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

/**
 * GET /api/scraped-parts/:modelName/categories
 * Get categories for a specific model
 */
router.get('/scraped-parts/:modelName/categories', async (req, res) => {
    try {
        const { modelName } = req.params;

        const categories = await require('../models').ScrapedPart
            .find({ modelName }, 'categoryName')
            .distinct('categoryName')
            .lean();

        res.json({ 
            modelName, 
            categories: categories || [] 
        });
    } catch (error) {
        console.error('[CATALOG] Scraped categories error:', error.message);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

/**
 * GET /api/scraped-parts/:modelName/:categoryName
 * Get sub-categories for a model and category
 */
router.get('/scraped-parts/:modelName/:categoryName', async (req, res) => {
    try {
        const { modelName, categoryName } = req.params;

        const subCategories = await require('../models').ScrapedPart
            .find({ 
                modelName, 
                categoryName 
            }, 'subCategoryName')
            .distinct('subCategoryName')
            .lean();

        res.json({ 
            modelName, 
            categoryName,
            subCategories: subCategories || [] 
        });
    } catch (error) {
        console.error('[CATALOG] Scraped sub-categories error:', error.message);
        res.status(500).json({ error: 'Failed to fetch sub-categories' });
    }
});

/**
 * GET /api/scraped-parts/:modelName/:categoryName/:subCategoryName
 * Get all parts for a specific path (model/category/subcategory)
 * Supports pagination with ?skip=0&limit=50
 */
router.get('/scraped-parts/:modelName/:categoryName/:subCategoryName', async (req, res) => {
    try {
        const { modelName, categoryName, subCategoryName } = req.params;
        const { skip = 0, limit = 50 } = req.query;

        const skipNum = Math.max(0, parseInt(skip) || 0);
        const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 50));

        const [parts, total] = await Promise.all([
            require('../models').ScrapedPart
                .find({ 
                    modelName, 
                    categoryName,
                    subCategoryName
                }, 'partName oemNumber description imageUrl scrapedAt')
                .sort({ partName: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .lean(),
            require('../models').ScrapedPart.countDocuments({ 
                modelName, 
                categoryName,
                subCategoryName
            })
        ]);

        res.json({ 
            modelName, 
            categoryName,
            subCategoryName,
            parts: parts || [],
            pagination: {
                total,
                skip: skipNum,
                limit: limitNum,
                hasMore: skipNum + limitNum < total
            }
        });
    } catch (error) {
        console.error('[CATALOG] Scraped parts error:', error.message);
        res.status(500).json({ error: 'Failed to fetch parts' });
    }
});

/**
 * GET /api/scraped-parts/search
 * Full-text search on part name and description
 * Query params:
 *   - q: search query (required)
 *   - modelName: filter by model (optional)
 *   - categoryName: filter by category (optional)
 *   - skip: pagination offset (default 0)
 *   - limit: results per page (default 50, max 1000)
 */
router.get('/scraped-parts/search', async (req, res) => {
    try {
        const { q, modelName, categoryName, skip = 0, limit = 50 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Search query (q) is required' });
        }

        const skipNum = Math.max(0, parseInt(skip) || 0);
        const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 50));

        // Build search filter
        const searchFilter = {
            $text: { $search: q }
        };

        if (modelName) searchFilter.modelName = modelName;
        if (categoryName) searchFilter.categoryName = categoryName;

        const [results, total] = await Promise.all([
            require('../models').ScrapedPart
                .find(
                    searchFilter,
                    { 
                        score: { $meta: 'textScore' },
                        partName: 1,
                        oemNumber: 1,
                        description: 1,
                        imageUrl: 1,
                        modelName: 1,
                        categoryName: 1,
                        subCategoryName: 1
                    }
                )
                .sort({ score: { $meta: 'textScore' } })
                .skip(skipNum)
                .limit(limitNum)
                .lean(),
            require('../models').ScrapedPart.countDocuments(searchFilter)
        ]);

        res.json({
            query: q,
            results: results || [],
            pagination: {
                total,
                skip: skipNum,
                limit: limitNum,
                hasMore: skipNum + limitNum < total
            }
        });
    } catch (error) {
        console.error('[CATALOG] Search error:', error.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * GET /api/scraped-parts/by-oemNumber/:oemNumber
 * Get a specific part by OEM number
 */
router.get('/scraped-parts/by-oemNumber/:oemNumber', async (req, res) => {
    try {
        const { oemNumber } = req.params;

        const part = await require('../models').ScrapedPart
            .findOne({ oemNumber }, '-__v')
            .lean();

        if (!part) {
            return res.status(404).json({ error: 'Part not found' });
        }

        res.json(part);
    } catch (error) {
        console.error('[CATALOG] OEM lookup error:', error.message);
        res.status(500).json({ error: 'Failed to fetch part' });
    }
});

/**
 * GET /api/scraped-parts/stats
 * Get scraping statistics
 */
router.get('/scraped-parts/stats', async (req, res) => {
    try {
        const { ScrapedPart } = require('../models');

        const [totalParts, uniqueModels, uniqueCategories, latestScrape] = await Promise.all([
            ScrapedPart.countDocuments(),
            ScrapedPart.countDocuments().then(() => 
                ScrapedPart.find({}, 'modelName').distinct('modelName')
            ).then(models => models.length),
            ScrapedPart.find({}, 'categoryName').distinct('categoryName').then(cats => cats.length),
            ScrapedPart.findOne({}, 'scrapedAt').sort({ scrapedAt: -1 }).lean()
        ]);

        res.json({
            statistics: {
                totalParts,
                uniqueModels,
                uniqueCategories,
                lastScrapedAt: latestScrape?.scrapedAt || null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CATALOG] Stats error:', error.message);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
