#!/usr/bin/env node

const VINDecoder = require('./scrapers/enhanced-vin-decoder');
const mongoose = require('mongoose');
const VehicleModel = require('./models/VehicleModel');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const models = await VehicleModel.find({}).lean();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ ENHANCED VIN DECODER - Comprehensive Database Test    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const testVins = [
      'WOPWGJ3236K000001',  // Corsa - Year 2027
      'WOBGJ3232J020001',   // Astra - Year 2018
      'WVZZZ3AZ9CE211299'   // Mokka - Engine code
    ];

    for (const vin of testVins) {
      console.log(`\nTesting VIN: ${vin}`);
      console.log('─'.repeat(58));
      
      try {
        const decoded = await VINDecoder.decodeVIN(vin, models);
        
        console.log(`  Model:        ${decoded.model || 'Not identified'}`);
        console.log(`  Year:         ${decoded.year || '?'}`);
        console.log(`  Engine:       ${decoded.engine || 'N/A'}`);
        console.log(`  Transmission: ${decoded.transmission || 'N/A'}`);
        console.log(`  Body Style:   ${decoded.body_style || 'N/A'}`);
        console.log(`  Plant Code:   ${decoded.plant}`);
        console.log(`  Confidence:   ${decoded.confidence}%`);
        console.log(`  Source:       ${decoded.source}`);
        
        if(decoded.modelId) {
          console.log(`  \n  ✅ Found in database: ${decoded.modelId}`);
          console.log(`  Database URL: ${decoded.modelDetails?.url || 'N/A'}`);
        } else {
          console.log(`\n  ⚠️  Model not found in database (${models.length} models available)`);
        }
      } catch(e) {
        console.log(`  ❌ Error: ${e.message}`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ STATISTICS                                             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`  Models in database: ${models.length}`);
    console.log(`  Models available:`);
    models.forEach(m => console.log(`    - ${m.name} (${m.type})`));

    console.log('\n  VIN Decoding by position:');
    console.log('    Position 10 (Index 9): Model Year (A-9, Y-0)');
    console.log('    WMI (0-2): Manufacturer (W0L = Opel)');
    console.log('    VDS (3-8): Vehicle descriptor');
    console.log('    VIS (9-17): Unique identifier');

    console.log('\n✅ Test complete\n');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
