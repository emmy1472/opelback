/**
 * Manual Data Import Tool for OEM Parts
 * 
 * Allows importing parts data from CSV or JSON formats
 * Usage:
 *   node import-data.js --file data.csv --format csv
 *   node import-data.js --file data.json --format json
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { VehicleModel, VehiclePart, VehicleCatalog } = require('./models');
require('dotenv').config();

// Parse CSV
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    data.push(row);
  }

  return data;
}

// Parse JSON
function parseJSON(jsonData) {
  return JSON.parse(jsonData);
}

// Import parts data
async function importParts(data, dataType = 'csv') {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ OEM Parts Data Importer                                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to MongoDB
    console.log('[IMPORTER] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/opelback');
    console.log('[IMPORTER] ✅ Connected\n');

    // Parse data
    let records;
    if (dataType === 'csv') {
      records = parseCSV(data);
      console.log(`[IMPORTER] Parsed ${records.length} CSV records\n`);
    } else {
      records = parseJSON(data);
      console.log(`[IMPORTER] Parsed ${records.length} JSON records\n`);
    }

    if (!Array.isArray(records) || records.length === 0) {
      console.error('[IMPORTER] ❌ No valid data found');
      process.exit(1);
    }

    // Get model mapping (not strictly needed for simplified schema, but good to have)
    const models = await VehicleModel.find();
    const modelMap = {};
    models.forEach(m => {
      modelMap[m.modelId] = m._id;
    });

    console.log(`[IMPORTER] Found ${models.length} vehicle models\n`);

    // Import parts
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.partNumber || !record.name) {
          console.log(`⚠️  Skipping: Missing partNumber or name in ${JSON.stringify(record)}`);
          skipped++;
          continue;
        }

        // Model is optional (schema doesn't store it)
        const model = record.model || 'general';

        // Create part object (matching VehiclePart schema)
        const partData = {
          name: record.name,
          number: record.partNumber.toUpperCase(),
          url: record.url || `https://opel.7zap.com/en/global/${model}-parts-catalog/`,
          parentUrl: `https://opel.7zap.com/en/global/${model}-parts-catalog/` + (record.category ? record.category.toLowerCase() + '/' : ''),
          createdAt: new Date()
        };

        // Upsert part (update if exists, insert if not)
        await VehiclePart.findOneAndUpdate(
          { number: partData.number },
          partData,
          { upsert: true, returnDocument: 'after' }
        );

        imported++;
        if (imported % 50 === 0) {
          console.log(`   ✅ Imported ${imported} parts...`);
        }
      } catch (error) {
        console.error(`❌ Error importing record: ${error.message}`);
        errors++;
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ IMPORT SUMMARY                                         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const totalParts = await VehiclePart.countDocuments();
    console.log(`✅ Imported:  ${imported}`);
    console.log(`⚠️  Skipped:  ${skipped}`);
    console.log(`❌ Errors:    ${errors}`);
    console.log(`────────────────────────────`);
    console.log(`📊 Total in database: ${totalParts}\n`);

  } catch (error) {
    console.error('[IMPORTER] ❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  let filePath = null;
  let format = 'csv';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === '--format') {
      format = args[i + 1];
      i++;
    }
  }

  if (!filePath) {
    console.log(`
Usage: node import-data.js --file <path> --format <format>

Examples:
  node import-data.js --file parts.csv --format csv
  node import-data.js --file parts.json --format json

CSV Format (header row required):
  partNumber,name,category,model,price,oem_price,aftermarket_price,description,manufacturer,url
  1628-451-007,Cylinder Head Gasket,Engine,corsa,142.50,142.50,89.99,OEM gasket,Opel,https://...
  1628-451-008,Valve Cover,Engine,corsa,89.99,89.99,54.99,OEM cover,Opel,https://...

JSON Format (array of objects):
  [
    {
      "partNumber": "1628-451-007",
      "name": "Cylinder Head Gasket",
      "category": "Engine",
      "model": "corsa",
      "price": 142.50,
      "manufacturer": "Opel"
    }
  ]

Supported Models: corsa, astra, mokka
Required Fields: partNumber, name, model
    `);
    process.exit(1);
  }

  // Read file
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  await importParts(data, format);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { importParts, parseCSV, parseJSON };
