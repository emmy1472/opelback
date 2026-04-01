// Create comprehensive JSON from database
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const VehicleModel = require('./models/VehicleModel');
const VehicleSpec = require('./models/VehicleSpec');
const VehicleCatalog = require('./models/VehicleCatalog');
const VehiclePart = require('./models/VehiclePart');

const VEHICLES = [
  'Corsa', 'Astra', 'Mokka', 'Grandland', 'Insignia', 
  'Vectra', 'Omega', 'Meriva', 'Zafira'
];

const CATEGORIES = [
  'Engine', 'Transmission', 'Suspension', 'Brakes',
  'Electrical', 'Cooling System', 'Fuel System', 'Exhaust System',
  'Interior', 'Exterior'
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch all data
    const models = await VehicleModel.find({}).lean();
    const specs = await VehicleSpec.find({}).lean();
    const catalogs = await VehicleCatalog.find({}).lean();
    const parts = await VehiclePart.find({}).lean();

    console.log(`Fetched: ${models.length} models, ${specs.length} specs, ${catalogs.length} catalogs, ${parts.length} parts`);

    // Build JSON
    const jsonData = {
      metadata: {
        version: '3.0',
        source: 'wikipedia',
        dataType: 'comprehensive-vehicle-catalog',
        createdAt: new Date().toISOString(),
        totalModels: models.length,
        totalSpecifications: specs.length,
        totalParts: parts.length,
        totalCategories: CATEGORIES.length,
        updateFrequency: 'monthly',
        lastUpdated: new Date().toISOString()
      },
      models: models.map(m => ({
        modelId: m.modelId,
        name: m.name,
        type: m.type,
        url: m.url,
        yearsSupported: m.yearsSupported,
        partsCatalogSize: m.partsCatalogSize,
        lastScrapedAt: m.lastScrapedAt
      })),
      specifications: specs.map(s => ({
        year: s.year,
        engine: s.engine,
        transmission: s.transmission,
        url: s.url,
        parentUrl: s.parentUrl,
        createdAt: s.createdAt
      })),
      catalogs: catalogs.map(c => ({
        name: c.name,
        url: c.url,
        parentUrl: c.parentUrl,
        createdAt: c.createdAt
      })),
      categories: CATEGORIES,
      parts: parts.map(p => ({
        name: p.name,
        number: p.number,
        url: p.url,
        parentUrl: p.parentUrl,
        category: p.category || 'Unknown',
        createdAt: p.createdAt
      }))
    };

    // Save to file
    fs.writeFileSync('comprehensive-vehicle-data.json', JSON.stringify(jsonData, null, 2));
    const fileSize = (fs.statSync('comprehensive-vehicle-data.json').size / 1024).toFixed(2);

    console.log(`\n✅ Created comprehensive-vehicle-data.json (${fileSize} KB)`);
    console.log(`   - Models: ${jsonData.models.length}`);
    console.log(`   - Specifications: ${jsonData.specifications.length}`);
    console.log(`   - Catalogs: ${jsonData.catalogs.length}`);
    console.log(`   - Parts: ${jsonData.parts.length}`);
    console.log(`   - Categories: ${jsonData.categories.length}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
