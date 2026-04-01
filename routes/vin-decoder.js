/**
 * VIN Decoder API Routes
 * 
 * Endpoints:
 * POST /api/vin/decode - Submit a VIN for decoding
 * GET /api/vin/:vin - Get cached VIN decode result
 * GET /api/vin/:vin/parts - Get parts for decoded VIN
 * GET /api/vin/:vin/specs - Get specs for decoded VIN
 */

const express = require('express');
const { VINLookup, VehicleModel, VehicleSpec, VehiclePart } = require('../models');
const vinDecoder = require('../scrapers/vin-decoder');
const { optionalAuth } = require('../auth');

const router = express.Router();

/**
 * POST /api/vin/decode
 * Submit a VIN for decoding
 */
router.post('/decode', optionalAuth, async (req, res) => {
    try {
        const { vin } = req.body;

        if (!vin || vin.length !== 17) {
            return res.status(400).json({ 
                error: 'VIN must be exactly 17 characters',
                example: 'WOPWGJ3236K000001'
            });
        }

        const upperVin = vin.toUpperCase();

        // Check if VIN already exists in cache
        const cached = await VINLookup.findOne({ vin: upperVin });
        if (cached) {
            console.log(`[VIN-API] Cache hit for VIN: ${upperVin}`);
            
            // Update access count and last accessed
            await VINLookup.updateOne(
                { vin: upperVin },
                { 
                    $inc: { access_count: 1 },
                    last_accessed: new Date()
                }
            );

            // Find related model and parts
            const modelData = cached.model_id ? 
                await VehicleModel.findOne({ modelId: cached.model_id }) : null;
            
            const specs = cached.spec_id ?
                await VehicleSpec.findById(cached.spec_id) : null;

            return res.json({
                success: true,
                source: 'cache',
                vin_info: cached,
                model: modelData,
                specs: specs
            });
        }

        // Decode the VIN
        console.log(`[VIN-API] Decoding VIN: ${upperVin}`);
        const decoded = await vinDecoder.decodeVIN(upperVin);

        // Try to find matching model
        let modelId = null;
        let specId = null;

        if (decoded.model) {
            // Search for matching model
            const modelName = decoded.model.toLowerCase();
            const vehicleModel = await VehicleModel.findOne({
                $or: [
                    { name: { $regex: modelName, $options: 'i' } },
                    { modelId: modelName }
                ]
            });

            if (vehicleModel) {
                modelId = vehicleModel.modelId;

                // Find matching specs
                if (decoded.year && vehicleModel.modelId) {
                    const vehicleSpec = await VehicleSpec.findOne({
                        modelId: vehicleModel.modelId,
                        year: decoded.year,
                        ...(decoded.engine && { engine: { $regex: decoded.engine, $options: 'i' } }),
                        ...(decoded.gearbox && { transmission: { $regex: decoded.gearbox, $options: 'i' } })
                    });

                    if (vehicleSpec) {
                        specId = vehicleSpec._id;
                    }
                }
            }
        }

        // Save to cache
        const vinLookup = new VINLookup({
            vin: upperVin,
            model: decoded.model,
            year: decoded.year,
            engine: decoded.engine,
            gearbox: decoded.gearbox,
            body_style: decoded.body_style,
            market: decoded.market,
            catalog_link: decoded.catalog_link,
            model_id: modelId,
            spec_id: specId,
            source: decoded.source,
            decoded_at: decoded.decoded_at,
            raw_data: decoded.raw_data || decoded
        });

        await vinLookup.save();
        console.log(`[VIN-API] ✅ VIN cached: ${upperVin}`);

        // Return complete information
        const modelData = modelId ? 
            await VehicleModel.findOne({ modelId: modelId }) : null;
        
        const specs = specId ?
            await VehicleSpec.findById(specId) : null;

        res.json({
            success: true,
            source: 'decoded',
            vin_info: vinLookup,
            model: modelData,
            specs: specs
        });

    } catch (error) {
        console.error('[VIN-API] Error:', error.message);
        res.status(500).json({ 
            error: error.message,
            vin: req.body.vin
        });
    }
});

/**
 * GET /api/vin/:vin
 * Get cached VIN decode result
 */
router.get('/:vin', async (req, res) => {
    try {
        const vin = req.params.vin.toUpperCase();

        if (vin.length !== 17) {
            return res.status(400).json({ error: 'VIN must be 17 characters' });
        }

        const vinLookup = await VINLookup.findOne({ vin: vin });

        if (!vinLookup) {
            return res.status(404).json({ 
                error: 'VIN not found',
                message: 'This VIN has not been decoded yet. Use POST /api/vin/decode to decode it.',
                vin: vin
            });
        }

        // Update access count
        await VINLookup.updateOne(
            { vin: vin },
            { 
                $inc: { access_count: 1 },
                last_accessed: new Date()
            }
        );

        // Get related model and specs
        const model = vinLookup.model_id ? 
            await VehicleModel.findOne({ modelId: vinLookup.model_id }) : null;
        
        const specs = vinLookup.spec_id ?
            await VehicleSpec.findById(vinLookup.spec_id) : null;

        res.json({
            success: true,
            vin_info: vinLookup,
            model: model,
            specs: specs
        });

    } catch (error) {
        console.error('[VIN-API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/vin/:vin/parts
 * Get parts that match the decoded VIN
 */
router.get('/:vin/parts', async (req, res) => {
    try {
        const vin = req.params.vin.toUpperCase();
        const { limit = 20, offset = 0 } = req.query;

        if (vin.length !== 17) {
            return res.status(400).json({ error: 'VIN must be 17 characters' });
        }

        const vinLookup = await VINLookup.findOne({ vin: vin });

        if (!vinLookup || !vinLookup.model_id) {
            return res.status(404).json({ 
                error: 'VIN not decoded or model not matched',
                message: 'Decode the VIN first using POST /api/vin/decode'
            });
        }

        // Find all parts for the matched model and optional year filter
        const query = { modelId: vinLookup.model_id };
        
        if (vinLookup.year) {
            // Try to find parts in VehicleCatalog that match this year
            const catalogs = await VehicleCatalog.find({
                modelId: vinLookup.model_id,
                year: vinLookup.year
            });

            if (catalogs.length > 0) {
                const categoryIds = catalogs.map(c => c.categoryId);
                query.categoryId = { $in: categoryIds };
            }
        }

        const total = await VehiclePart.countDocuments(query);
        const parts = await VehiclePart.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .select('partNumber name categoryId specifications pricing imageUrl');

        res.json({
            success: true,
            vin: vin,
            model: vinLookup.model,
            year: vinLookup.year,
            engine: vinLookup.engine,
            gearbox: vinLookup.gearbox,
            parts: {
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                data: parts
            }
        });

    } catch (error) {
        console.error('[VIN-API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/vin/:vin/specs
 * Get vehicle specifications for this VIN
 */
router.get('/:vin/specs', async (req, res) => {
    try {
        const vin = req.params.vin.toUpperCase();

        if (vin.length !== 17) {
            return res.status(400).json({ error: 'VIN must be 17 characters' });
        }

        const vinLookup = await VINLookup.findOne({ vin: vin });

        if (!vinLookup) {
            return res.status(404).json({ 
                error: 'VIN not decoded yet',
                message: 'Use POST /api/vin/decode to decode this VIN'
            });
        }

        // Find all specs matching this vehicle
        const specs = await VehicleSpec.find({
            modelId: vinLookup.model_id,
            ...(vinLookup.year && { year: vinLookup.year })
        }).select('year engine transmission trim bodyType catalogId');

        res.json({
            success: true,
            vin: vin,
            model: vinLookup.model,
            year: vinLookup.year,
            specs: {
                total: specs.length,
                data: specs
            }
        });

    } catch (error) {
        console.error('[VIN-API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/vin/history
 * Get recently decoded VINs
 */
router.get('/history/recent', optionalAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recent = await VINLookup.find()
            .sort({ last_accessed: -1 })
            .limit(limit)
            .select('vin model year engine gearbox last_accessed access_count source');

        res.json({
            success: true,
            total: await VINLookup.countDocuments(),
            recent: recent
        });

    } catch (error) {
        console.error('[VIN-API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/vin/stats
 * VIN decoder statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const total = await VINLookup.countDocuments();
        const bySource = await VINLookup.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        const topModels = await VINLookup.aggregate([
            { $match: { model: { $ne: null } } },
            { $group: { _id: '$model', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            stats: {
                total_decoded: total,
                by_source: bySource,
                top_models: topModels
            }
        });

    } catch (error) {
        console.error('[VIN-API] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
