#!/usr/bin/env node

/**
 * Master Scraper CLI - Quick Start Execution Script
 * 
 * Usage:
 *   npm run scrape:all       - Scrape all models (Corsa, Astra, Mokka)
 *   npm run scrape:corsa     - Scrape only Corsa
 *   npm run scrape:astra     - Scrape only Astra
 *   npm run scrape:mokka     - Scrape only Mokka
 *   npm run scrape:verify    - Verify database after scraping
 */

const mongoose = require('mongoose');
const { VehicleModel, VehicleSpec, VehiclePart, VehicleCatalog } = require('./models');
require('dotenv').config();

async function verifyScraping() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║            Database Verification Report                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Get collection stats
    const modelCount = await VehicleModel.countDocuments();
    const specCount = await VehicleSpec.countDocuments();
    const partCount = await VehiclePart.countDocuments();
    const catalogCount = await VehicleCatalog.countDocuments();

    // Get breakdown by model
    const modelDetails = await VehicleModel.find().lean();
    
    console.log('📊 Collection Counts:');
    console.log(`   Vehicle Models:    ${modelCount}`);
    console.log(`   Vehicle Specs:     ${specCount}`);
    console.log(`   Vehicle Parts:     ${partCount}`);
    console.log(`   Catalogs:          ${catalogCount}`);

    console.log('\n🚗 Models & Data:');
    for (const model of modelDetails) {
      const modelSpecs = await VehicleSpec.countDocuments({ modelId: model.modelId });
      const modelParts = await VehiclePart.countDocuments({ modelId: model.modelId });
      const modelCatalogs = await VehicleCatalog.countDocuments({ modelId: model.modelId });
      
      console.log(`   ${model.name}:`);
      console.log(`      - Specs:    ${modelSpecs}`);
      console.log(`      - Parts:    ${modelParts}`);
      console.log(`      - Catalogs: ${modelCatalogs}`);
    }

    // Check for duplicate parts
    const duplicateCheck = await VehiclePart.aggregate([
      { $group: { _id: "$partNumber", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log('\n✅ Status Checks:');
    console.log(`   Duplicate parts: ${duplicateCheck.length}`);
    console.log(`   Database health: ${modelCount > 0 ? '✅ GOOD' : '❌ EMPTY'}`);

    if (modelCount === 0) {
      console.log('\n⚠️  Database appears empty. Run scraper first:');
      console.log('   npm run scrape:all');
    } else {
      console.log('\n✨ Database is ready for API testing!');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  const command = process.argv[2] || 'verify';

  if (command === 'verify') {
    await verifyScraping();
  } else {
    console.log('Unknown command:', command);
    console.log('\nAvailable commands:');
    console.log('  npm run scrape:verify   - Check database status');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyScraping };
