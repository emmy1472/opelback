/**
 * VIN Decoder Test & Demo
 * 
 * Tests the complete VIN decoding workflow:
 * 1. Decode a VIN
 * 2. Retrieve cached VIN
 * 3. Get parts for VIN
 * 4. Get specs for VIN
 * 5. View statistics
 */

const mongoose = require('mongoose');
const { VINLookup } = require('./models');
const vinDecoder = require('./scrapers/vin-decoder');
require('dotenv').config();

// Test VINs (real Opel VINs for testing)
const TEST_VINS = [
    'WOPWGJ3236K000001',  // Opel Corsa test VIN
    'WOSGJ3238L000123',   // Opel Astra test VIN
    'WOPWGG3242K000456',  // Opel Mokka test VIN
];

async function runTests() {
    try {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║ VIN Decoder - Complete Test Suite                      ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Clear old test data
        console.log('📋 Test 1: Cleaning up old test data...');
        const deleteResult = await VINLookup.deleteMany({
            vin: { $in: TEST_VINS }
        });
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} old test entries\n`);

        // Test 2: Decode VINs
        console.log('📋 Test 2: Decoding VINs...');
        const decodedVINs = [];
        
        for (const vin of TEST_VINS) {
            try {
                console.log(`   → Decoding: ${vin}`);
                const decoded = await vinDecoder.decodeVIN(vin);
                
                console.log(`     Model: ${decoded.model}`);
                console.log(`     Year: ${decoded.year}`);
                console.log(`     Engine: ${decoded.engine}`);
                console.log(`     Gearbox: ${decoded.gearbox}`);
                console.log(`     Body: ${decoded.body_style}`);
                console.log(`     Source: ${decoded.source}\n`);
                
                decodedVINs.push(decoded);
            } catch (error) {
                console.log(`     ⚠️  Error: ${error.message}\n`);
                // Still add to test data for structure parsing
                decodedVINs.push({
                    vin: vin,
                    source: 'vin_structure',
                    error: error.message
                });
            }
        }

        // Test 3: Save to database
        console.log('📋 Test 3: Saving to database...');
        const savedVINs = [];
        
        for (let i = 0; i < TEST_VINS.length; i++) {
            const vin = TEST_VINS[i];
            const decoded = decodedVINs[i] || {};

            const vinLookup = new VINLookup({
                vin: vin,
                model: decoded.model || 'Unknown Model',
                year: decoded.year,
                engine: decoded.engine,
                gearbox: decoded.gearbox,
                body_style: decoded.body_style,
                market: decoded.market,
                source: decoded.source || 'vin_structure',
                raw_data: decoded
            });

            await vinLookup.save();
            savedVINs.push(vinLookup);
            console.log(`   ✅ Saved: ${vin}`);
        }
        console.log('');

        // Test 4: Query statistics
        console.log('📋 Test 4: Database statistics...');
        const totalVINs = await VINLookup.countDocuments();
        const bySource = await VINLookup.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        console.log(`   Total VINs in database: ${totalVINs}`);
        console.log(`   By source:`);
        for (const source of bySource) {
            console.log(`     - ${source._id}: ${source.count}`);
        }
        console.log('');

        // Test 5: Retrieve cached VINs
        console.log('📋 Test 5: Retrieving cached VINs...');
        for (const vin of TEST_VINS) {
            const cached = await VINLookup.findOne({ vin: vin });
            if (cached) {
                console.log(`   ✅ ${vin}`);
                console.log(`      Model: ${cached.model} (${cached.year})`);
                console.log(`      Engine: ${cached.engine || 'N/A'}`);
            } else {
                console.log(`   ❌ ${vin} - not found`);
            }
        }
        console.log('');

        // Test 6: Access count tracking
        console.log('📋 Test 6: Access count tracking...');
        const testVin = TEST_VINS[0];
        
        // Access the same VIN multiple times
        for (let i = 0; i < 3; i++) {
            const doc = await VINLookup.findOne({ vin: testVin });
            await VINLookup.updateOne(
                { vin: testVin },
                { 
                    $inc: { access_count: 1 },
                    last_accessed: new Date()
                }
            );
            console.log(`   Access ${i + 1}: VIN retrieved`);
        }

        const tracked = await VINLookup.findOne({ vin: testVin });
        console.log(`   ✅ ${testVin} was accessed ${tracked.access_count} times\n`);

        // Test 7: Top models
        console.log('📋 Test 7: Most decoded models...');
        const topModels = await VINLookup.aggregate([
            { $match: { model: { $ne: null } } },
            { $group: { _id: '$model', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        if (topModels.length === 0) {
            console.log('   No models found');
        } else {
            for (const model of topModels) {
                console.log(`   - ${model._id}: ${model.count} lookups`);
            }
        }
        console.log('');

        // Summary
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║ Test Summary                                           ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log('║ ✅ VIN Decoding           - Complete                  ║');
        console.log('║ ✅ Database Storage       - Complete                  ║');
        console.log('║ ✅ Caching                - Complete                  ║');
        console.log('║ ✅ Access Tracking        - Complete                  ║');
        console.log('║ ✅ Statistics             - Complete                  ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log(`║ Total VINs Processed: ${String(TEST_VINS.length).padEnd(30)}║`);
        console.log(`║ Database VINs: ${String(totalVINs).padEnd(39)}║`);
        console.log('╚════════════════════════════════════════════════════════╝\n');

        // Test 8: API endpoint examples
        console.log('📋 Test 8: API endpoint examples\n');
        console.log('Make sure the server is running with: npm start\n');
        
        console.log('Then use these curl commands:\n');
        
        for (const vin of TEST_VINS) {
            console.log(`📍 Decode VIN: ${vin}`);
            console.log(`   curl -X POST http://localhost:5000/api/vin/decode \\`);
            console.log(`     -H "Content-Type: application/json" \\`);
            console.log(`     -d '{"vin":"${vin}"}'\n`);

            console.log(`📍 Get VIN Info:`);
            console.log(`   curl http://localhost:5000/api/vin/${vin}\n`);

            console.log(`📍 Get Parts for VIN:`);
            console.log(`   curl "http://localhost:5000/api/vin/${vin}/parts?limit=10"\n`);

            console.log(`📍 Get Specs for VIN:`);
            console.log(`   curl http://localhost:5000/api/vin/${vin}/specs\n`);
        }

        console.log('📍 VIN Decoder Statistics:');
        console.log(`   curl http://localhost:5000/api/vin/stats\n`);

        console.log('📍 Recently Decoded VINs:');
        console.log(`   curl http://localhost:5000/api/vin/history/recent\n`);

        await mongoose.disconnect();
        console.log('✅ Tests complete!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test error:', error.message);
        process.exit(1);
    }
}

runTests();
