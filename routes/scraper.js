/**
 * Deep Scraping Routes
 * Endpoints for recursive catalog scraping
 */
const express = require('express');
const { authMiddleware } = require('../auth');
const { deepScrapeModels, scrapeCategoryStack } = require('../scrapers/deep-scraper');
const config = require('../config');

const router = express.Router();

/**
 * POST /api/scrape/models
 * Deep scrape an array of models and auto-save all parts to database
 * 
 * Request body:
 * {
 *   "models": [
 *     { "name": "Astra", "url": "https://opel.7zap.com/en/global/astra/" },
 *     ...
 *   ]
 * }
 * 
 * Returns: Scraping statistics (models processed, parts saved, etc.)
 */
router.post('/models', authMiddleware, async (req, res) => {
    try {
        const { models } = req.body;

        if (!Array.isArray(models) || models.length === 0) {
            return res.status(400).json({ error: 'models array is required and must not be empty' });
        }

        // Validate each model
        const validModels = models.filter(m => m.name && m.url && typeof m.url === 'string');
        if (validModels.length === 0) {
            return res.status(400).json({ error: 'Each model must have name and url properties' });
        }

        console.log(`[SCRAPE-API] Starting deep scrape of ${validModels.length} models with DB persistence`);

        // Execute scraping and await results
        // Note: This is still async but we return the full stats
        try {
            const stats = await deepScrapeModels(validModels);

            res.json({
                status: 'completed',
                message: 'Deep scraping completed and data saved to database',
                statistics: stats,
                timestamp: new Date().toISOString()
            });

        } catch (scrapingError) {
            console.error(`[SCRAPE-API] Scraping error: ${scrapingError.message}`);
            res.status(500).json({
                status: 'error',
                error: 'Scraping failed',
                message: scrapingError.message
            });
        }

    } catch (error) {
        console.error('[SCRAPE-API] Models endpoint error:', error.message);
        res.status(500).json({ error: 'Scraping request failed', message: error.message });
    }
});

/**
 * POST /api/scrape/category-stack
 * Scrape a single category URL down to parts and auto-save to database
 * 
 * Request body:
 * {
 *   "categoryUrl": "https://opel.7zap.com/en/global/astra-engine/",
 *   "modelName": "Astra",       // optional - for database context
 *   "categoryName": "Engine"    // optional - for database context
 * }
 * 
 * Returns: Sub-categories and parts from that URL, plus statistics
 */
router.post('/category-stack', authMiddleware, async (req, res) => {
    try {
        const { categoryUrl, modelName = 'Unknown', categoryName = 'Unknown' } = req.body;

        if (!categoryUrl || typeof categoryUrl !== 'string') {
            return res.status(400).json({ error: 'categoryUrl is required and must be a string' });
        }

        // Validate URL format
        try {
            new URL(categoryUrl);
        } catch {
            return res.status(400).json({ error: 'categoryUrl must be a valid URL' });
        }

        console.log(`[SCRAPE-API] Starting category stack scrape: ${categoryUrl.substring(0, 80)}`);

        // Set timeout for response
        const timeout = setTimeout(() => {
            res.status(504).json({ 
                error: 'Scraping timeout', 
                message: 'The scraping operation took too long to complete' 
            });
        }, 120000); // 2 minute timeout

        try {
            const result = await scrapeCategoryStack(categoryUrl, modelName, categoryName);
            clearTimeout(timeout);

            res.json({
                status: 'success',
                message: 'Category scraping completed and data saved to database',
                statistics: {
                    savedCount: result.savedCount,
                    failedCount: result.failedCount,
                    errors: result.errors
                },
                data: result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }

    } catch (error) {
        console.error('[SCRAPE-API] Category stack error:', error.message);
        res.status(500).json({ error: 'Scraping failed', message: error.message });
    }
});

/**
 * GET /api/scrape/status/:trackingId
 * Check status of a scraping job
 */
router.get('/status/:trackingId', authMiddleware, async (req, res) => {
    try {
        const { trackingId } = req.params;

        // In a production app, you'd query a jobs database
        // For now, return a placeholder
        res.json({
            trackingId,
            status: 'in-progress',
            message: 'Job is currently running',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[SCRAPE-API] Status check error:', error.message);
        res.status(500).json({ error: 'Status check failed' });
    }
});

/**
 * GET /api/scrape/health
 * Health check for scraper service
 */
router.get('/health', (req, res) => {
    res.json({
        service: 'deep-scraper',
        status: 'operational',
        capabilities: [
            'model_deep_scraping',
            'category_stack_scraping',
            'hierarchical_part_extraction'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
