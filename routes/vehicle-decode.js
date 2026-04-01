/**
 * ENHANCED VIN DECODER ROUTES
 * Integrates with comprehensive vehicle database
 * Three-tier workflow: VIN → Vehicle Attributes → OEM Parts
 */

const express = require('express');
const VINDecoder = require('../scrapers/enhanced-vin-decoder');
const { optionalAuth } = require('../auth');

const router = express.Router();

// Import models
const VehicleModel = require('../models/VehicleModel');
const VehicleSpec = require('../models/VehicleSpec');
const VehiclePart = require('../models/VehiclePart');
const VICatalog = require('../models/VehicleCatalog');

/**
 * POST /api/v2/vehicle/decode/vin
 * Main VIN decode endpoint
 * Input: { vin: "WOPWGJ3236K000001" }
 * Output: Vehicle details + specifications + related parts
 */
router.post('/decode/vin', optionalAuth, async (req, res) => {
  try {
    const { vin } = req.body;

    // Validate VIN format
    if (!vin || typeof vin !== 'string' || vin.trim().length !== 17) {
      return res.status(400).json({
        success: false,
        error: 'VIN must be exactly 17 characters',
        example: 'WOPWGJ3236K000001'
      });
    }

    const vinUpper = vin.toUpperCase().trim();

    console.log(`[VIN-ROUTE] Processing VIN: ${vinUpper}`);

    // Step 1: Decode VIN structure
    const models = await VehicleModel.find({}).lean();
    const vinDecoded = await VINDecoder.decodeVIN(vinUpper, models);

    if (!vinDecoded) {
      return res.status(400).json({
        success: false,
        error: 'Unable to decode VIN',
        vin: vinUpper
      });
    }

    console.log(`[VIN-ROUTE] Decoded model: ${vinDecoded.model}, year: ${vinDecoded.year}`);

    // Step 2: Find matching vehicle model
    let vehicleModel = null;
    let specifications = [];
    let parts = [];
    let catalog = [];

    if (vinDecoded.model) {
      vehicleModel = await VehicleModel.findOne({
        $or: [
          { name: { $regex: vinDecoded.model, $options: 'i' } },
          { modelId: vinDecoded.model.toLowerCase().replace(/\s+/g, '-') }
        ]
      }).lean();

      if (vehicleModel) {
        console.log(`[VIN-ROUTE] ✅ Found model: ${vehicleModel.name}`);

        // Step 3: Find matching specifications
        if (vinDecoded.year) {
          specifications = await VehicleSpec.find({
            parentUrl: { $regex: vehicleModel.name, $options: 'i' },
            year: vinDecoded.year.toString()
          }).lean();

          // If exact year not found, search within ±2 years
          if (specifications.length === 0) {
            const yearsRange = [
              vinDecoded.year - 2, vinDecoded.year - 1, vinDecoded.year,
              vinDecoded.year + 1, vinDecoded.year + 2
            ];
            specifications = await VehicleSpec.find({
              parentUrl: { $regex: vehicleModel.name, $options: 'i' },
              year: { $in: yearsRange.map(y => y.toString()) }
            }).lean();
          }

          console.log(`[VIN-ROUTE] Found ${specifications.length} specifications`);
        }

        // Step 4: Find related parts
        parts = await VehiclePart.find({
          $or: [
            { parentUrl: { $regex: vehicleModel.name, $options: 'i' } },
            { model: vehicleModel.modelId }
          ]
        }).lean();

        console.log(`[VIN-ROUTE] Found ${parts.length} parts for ${vehicleModel.name}`);

        // Step 5: Find catalog entries
        catalog = await VICatalog.find({
          parentUrl: { $regex: vehicleModel.name, $options: 'i' }
        }).lean();

        console.log(`[VIN-ROUTE] Found ${catalog.length} catalog entries`);
      }
    }

    // Build response
    const response = {
      success: true,
      vin: vinUpper,
      decoding: {
        source: vinDecoded.source,
        confidence: `${vinDecoded.confidence}%`,
        timestamp: vinDecoded.decodedAt
      },
      vehicle: {
        model: vinDecoded.model || 'Unknown',
        year: vinDecoded.year || 'Unknown',
        engine: vinDecoded.engine || 'Unknown',
        transmission: vinDecoded.transmission || 'Unknown',
        bodyStyle: vinDecoded.body_style || 'Unknown',
        plant: vinDecoded.plant || 'Unknown'
      },
      modelDetails: vehicleModel ? {
        modelId: vehicleModel.modelId,
        name: vehicleModel.name,
        type: vehicleModel.type,
        yearsSupported: vehicleModel.yearsSupported,
        catalogUrl: vehicleModel.baseUrl
      } : null,
      specifications: {
        count: specifications.length,
        data: specifications.slice(0, 5)  // Return top 5
      },
      parts: {
        count: parts.length,
        byCategory: parts.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {}),
        sample: parts.slice(0, 5)  // Return sample
      },
      catalog: {
        count: catalog.length,
        categories: catalog.map(c => c.name).slice(0, 5)
      },
      links: {
        specs: `/api/v2/vehicle/specs?model=${vehicleModel?.modelId}&year=${vinDecoded.year}`,
        parts: `/api/v2/vehicle/parts?model=${vehicleModel?.modelId}`,
        catalog: `/api/v2/catalog/${vehicleModel?.modelId}`
      }
    };

    console.log(`[VIN-ROUTE] ✅ Complete response ready`);
    res.json(response);

  } catch (error) {
    console.error(`[VIN-ROUTE] Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      vin: req.body?.vin
    });
  }
});

/**
 * GET /api/v2/vehicle/decode/vin/:vin
 * Quick VIN decode (GET version)
 */
router.get('/decode/vin/:vin', optionalAuth, async (req, res) => {
  try {
    const vin = req.params.vin.toUpperCase().trim();

    if (vin.length !== 17) {
      return res.status(400).json({
        success: false,
        error: 'VIN must be 17 characters'
      });
    }

    // Use the POST endpoint logic
    const models = await VehicleModel.find({}).lean();
    const vinDecoded = await VINDecoder.decodeVIN(vin, models);

    res.json({
      success: true,
      vin: vin,
      ...vinDecoded
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/vehicle/decode/license-plate
 * Placeholder for license plate to VIN lookup
 * (Would require external service or database like vehicle registration DB)
 */
router.post('/decode/license-plate', optionalAuth, async (req, res) => {
  try {
    const { licensePlate, country } = req.body;

    if (!licensePlate) {
      return res.status(400).json({
        success: false,
        error: 'License plate is required'
      });
    }

    // This would require integration with external service
    // For now, return placeholder response
    res.json({
      success: false,
      message: 'License plate lookup requires external registration database integration',
      licensePlate: licensePlate,
      note: 'To use this endpoint, integrate with vehicle registration service or provide VIN directly'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/vehicle/specs
 * Get specifications matching decoded vehicle
 */
router.get('/specs', optionalAuth, async (req, res) => {
  try {
    const { model, year, engine, transmission } = req.query;

    const query = {};
    if (model) query.parentUrl = { $regex: model, $options: 'i' };
    if (year) query.year = year.toString();
    if (engine) query.engine = { $regex: engine, $options: 'i' };
    if (transmission) query.transmission = { $regex: transmission, $options: 'i' };

    const specs = await VehicleSpec.find(query).lean();

    res.json({
      success: true,
      query: query,
      count: specs.length,
      specs: specs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/vehicle/parts
 * Get parts for a specific model/category
 */
router.get('/parts', optionalAuth, async (req, res) => {
  try {
    const { model, category, search } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);

    const query = {};
    if (model) query.model = { $regex: model, $options: 'i' };
    if (category) query.category = { $regex: category, $options: 'i' };
    if (search) query.name = { $regex: search, $options: 'i' };

    const parts = await VehiclePart.find(query)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      query: query,
      count: parts.length,
      parts: parts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/vehicle/parts-catalog
 * Get complete parts catalog for model
 */
router.get('/parts-catalog', optionalAuth, async (req, res) => {
  try {
    const { model } = req.query;

    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Model parameter is required'
      });
    }

    // Find model
    const vehicleModel = await VehicleModel.findOne({
      $or: [
        { name: { $regex: model, $options: 'i' } },
        { modelId: model }
      ]
    }).lean();

    if (!vehicleModel) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Get all parts for this model
    const parts = await VehiclePart.find({
      $or: [
        { model: vehicleModel.modelId },
        { parentUrl: { $regex: vehicleModel.name, $options: 'i' } }
      ]
    }).lean();

    // Group by category
    const byCategory = {};
    parts.forEach(part => {
      if (!byCategory[part.category]) {
        byCategory[part.category] = [];
      }
      byCategory[part.category].push(part);
    });

    res.json({
      success: true,
      model: vehicleModel.name,
      totalParts: parts.length,
      categories: Object.keys(byCategory).length,
      byCategory: byCategory
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
