/**
 * Parts Import Routes
 * 
 * POST /api/parts/import - Import parts from JSON
 * POST /api/parts/import/csv - Import parts from CSV
 * GET /api/parts/import/status - Check import status
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Import models
const { VehicleModel, VehiclePart } = require('../models');

// Setup multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.json'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

/**
 * Parse CSV content
 */
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parser (doesn't handle quoted fields with commas)
    const values = line.split(',').map(v => v.trim());
    const record = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || null;
    });
    
    records.push(record);
  }

  return records;
}

/**
 * Import parts from JSON
 * POST /api/parts/import
 * 
 * Body: {
 *   "parts": [
 *     {
 *       "partNumber": "123456",
 *       "name": "Part Name",
 *       "category": "Engine",
 *       "model": "corsa",
 *       "price": 99.99
 *     }
 *   ]
 * }
 */
router.post('/import', async (req, res) => {
  try {
    const { parts } = req.body;

    if (!Array.isArray(parts)) {
      return res.status(400).json({
        success: false,
        error: 'parts must be an array'
      });
    }

    if (parts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'parts array cannot be empty'
      });
    }

    // Get model mapping
    const models = await VehicleModel.find();
    const modelMap = {};
    models.forEach(m => {
      modelMap[m.modelId.toLowerCase()] = m._id;
    });

    let imported = 0;
    let errors = [];

    for (const part of parts) {
      try {
        // Validate
        if (!part.partNumber || !part.name || !part.model) {
          errors.push(`Missing required fields: ${JSON.stringify(part)}`);
          continue;
        }

        const modelId = modelMap[part.model.toLowerCase()];
        if (!modelId) {
          errors.push(`Unknown model: ${part.model}`);
          continue;
        }

        // Create part
        const partData = {
          partNumber: part.partNumber.toUpperCase(),
          name: part.name,
          categoryId: part.category || 'General',
          modelId: modelId,
          price: part.price ? parseFloat(part.price) : null,
          oemPrice: part.oem_price ? parseFloat(part.oem_price) : null,
          aftermarketPrice: part.aftermarket_price ? parseFloat(part.aftermarket_price) : null,
          description: part.description || '',
          specification: part.specification || '',
          manufacturer: part.manufacturer || 'Opel',
          source: 'api_import',
          url: part.url || '',
          scrapedAt: new Date(),
          lastUpdated: new Date()
        };

        await VehiclePart.findOneAndUpdate(
          { partNumber: partData.partNumber, modelId: modelId },
          partData,
          { upsert: true, returnDocument: 'after' }
        );

        imported++;
      } catch (error) {
        errors.push(`Error with part ${part.partNumber}: ${error.message}`);
      }
    }

    const totalParts = await VehiclePart.countDocuments();

    res.json({
      success: true,
      message: `Successfully imported ${imported}/${parts.length} parts`,
      imported,
      errors: errors.length > 0 ? errors.slice(0, 10) : null,
      totalInDatabase: totalParts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Import parts from CSV file
 * POST /api/parts/import/csv
 * 
 * Multipart form with 'file' field
 */
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Read file
    const filePath = req.file.path;
    const csvData = fs.readFileSync(filePath, 'utf-8');
    const records = parseCSV(csvData);

    // Delete temp file
    fs.unlinkSync(filePath);

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No records found in CSV'
      });
    }

    // Get model mapping
    const models = await VehicleModel.find();
    const modelMap = {};
    models.forEach(m => {
      modelMap[m.modelId.toLowerCase()] = m._id;
    });

    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const record of records) {
      try {
        // Validate
        if (!record.partNumber || !record.name || !record.model) {
          skipped++;
          continue;
        }

        const modelId = modelMap[record.model.toLowerCase()];
        if (!modelId) {
          skipped++;
          continue;
        }

        // Create part
        const partData = {
          partNumber: record.partNumber.toUpperCase(),
          name: record.name,
          categoryId: record.category || 'General',
          modelId: modelId,
          price: record.price ? parseFloat(record.price) : null,
          oemPrice: record.oem_price ? parseFloat(record.oem_price) : null,
          aftermarketPrice: record.aftermarket_price ? parseFloat(record.aftermarket_price) : null,
          description: record.description || '',
          specification: record.specification || '',
          manufacturer: record.manufacturer || 'Opel',
          source: 'csv_import',
          url: record.url || '',
          scrapedAt: new Date(),
          lastUpdated: new Date()
        };

        await VehiclePart.findOneAndUpdate(
          { partNumber: partData.partNumber, modelId: modelId },
          partData,
          { upsert: true, returnDocument: 'after' }
        );

        imported++;
      } catch (error) {
        errors.push(error.message);
      }
    }

    const totalParts = await VehiclePart.countDocuments();

    res.json({
      success: true,
      message: `Imported ${imported} parts from CSV`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 5) : null,
      totalInDatabase: totalParts
    });

  } catch (error) {
    // Clean up file if error
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(() => {});
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get import status
 * GET /api/parts/import/status
 */
router.get('/status', async (req, res) => {
  try {
    const partCount = await VehiclePart.countDocuments();
    const modelCount = await VehicleModel.countDocuments();
    const bySource = await VehiclePart.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      totalParts: partCount,
      totalModels: modelCount,
      bySource: bySource.reduce((acc, cur) => {
        acc[cur._id || 'unknown'] = cur.count;
        return acc;
      }, {})
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
