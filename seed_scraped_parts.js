/**
 * Seed the database with sample scraped parts data
 * This allows testing the query endpoints without hitting external websites
 */

const mongoose = require('mongoose');
const { ScrapedPart } = require('./models');
require('dotenv').config();

async function seedDatabase() {
    try {
        console.log('[SEED] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('[SEED] Clearing existing ScrapedPart data...');
        await ScrapedPart.deleteMany({});
        console.log('✅ Cleared old data');

        // Sample test data - realistic Opel parts
        const sampleParts = [
            // Astra - Engine parts
            {
                modelName: 'Opel Astra',
                categoryName: 'Engine',
                subCategoryName: 'Pistons & Rings',
                partName: 'Piston Ring Set',
                oemNumber: 'OP-PSR-001',
                description: 'Original equipment piston ring set for standard engines',
                imageUrl: 'https://via.placeholder.com/150?text=Piston+Rings',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/engine',
                subCategoryUrl: 'https://example.com/astra/engine/pistons',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Astra',
                categoryName: 'Engine',
                subCategoryName: 'Pistons & Rings',
                partName: 'Piston Pins',
                oemNumber: 'OP-PSP-001',
                description: 'Precision piston pins for connecting rod assembly',
                imageUrl: 'https://via.placeholder.com/150?text=Piston+Pins',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/engine',
                subCategoryUrl: 'https://example.com/astra/engine/pistons',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Astra',
                categoryName: 'Engine',
                subCategoryName: 'Oil & Filters',
                partName: 'Engine Oil Filter',
                oemNumber: 'OP-OIL-001',
                description: 'High-quality engine oil filter for superior engine protection',
                imageUrl: 'https://via.placeholder.com/150?text=Oil+Filter',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/engine',
                subCategoryUrl: 'https://example.com/astra/engine/oil',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Astra',
                categoryName: 'Engine',
                subCategoryName: 'Oil & Filters',
                partName: 'Air Filter',
                oemNumber: 'OP-AIR-001',
                description: 'Multi-stage engine air filter',
                imageUrl: 'https://via.placeholder.com/150?text=Air+Filter',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/engine',
                subCategoryUrl: 'https://example.com/astra/engine/oil',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Astra',
                categoryName: 'Engine',
                subCategoryName: 'Cooling System',
                partName: 'Engine Coolant',
                oemNumber: 'OP-COOL-001',
                description: 'Premium long-life engine coolant',
                imageUrl: 'https://via.placeholder.com/150?text=Coolant',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/engine',
                subCategoryUrl: 'https://example.com/astra/engine/cooling',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Astra',
                categoryName: 'Engine',
                subCategoryName: 'Cooling System',
                partName: 'Thermostat',
                oemNumber: 'OP-THERM-001',
                description: 'Engine thermostat for temperature regulation',
                imageUrl: 'https://via.placeholder.com/150?text=Thermostat',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/engine',
                subCategoryUrl: 'https://example.com/astra/engine/cooling',
                scrapedAt: new Date()
            },

            // Astra - Transmission parts
            {
                modelName: 'Opel Astra',
                categoryName: 'Transmission',
                subCategoryName: 'Automatic Transmission',
                partName: 'Transmission Fluid',
                oemNumber: 'OP-TRANS-001',
                description: 'Automatic transmission fluid - red',
                imageUrl: 'https://via.placeholder.com/150?text=Trans+Fluid',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/transmission',
                subCategoryUrl: 'https://example.com/astra/transmission/auto',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Astra',
                categoryName: 'Transmission',
                subCategoryName: 'Automatic Transmission',
                partName: 'Transmission Filter',
                oemNumber: 'OP-TRANSF-001',
                description: 'Automatic transmission filter',
                imageUrl: 'https://via.placeholder.com/150?text=Trans+Filter',
                modelUrl: 'https://example.com/astra',
                categoryUrl: 'https://example.com/astra/transmission',
                subCategoryUrl: 'https://example.com/astra/transmission/auto',
                scrapedAt: new Date()
            },

            // Corsa - Engine parts
            {
                modelName: 'Opel Corsa',
                categoryName: 'Engine',
                subCategoryName: 'Spark Plugs',
                partName: 'Spark Plug Iridium',
                oemNumber: 'OP-SP-002',
                description: 'Iridium spark plugs for extended service life',
                imageUrl: 'https://via.placeholder.com/150?text=Spark+Plug',
                modelUrl: 'https://example.com/corsa',
                categoryUrl: 'https://example.com/corsa/engine',
                subCategoryUrl: 'https://example.com/corsa/engine/spark',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Corsa',
                categoryName: 'Engine',
                subCategoryName: 'Oil & Filters',
                partName: 'Engine Oil Filter',
                oemNumber: 'OP-OIL-002',
                description: 'High-quality engine oil filter for compact engines',
                imageUrl: 'https://via.placeholder.com/150?text=Oil+Filter',
                modelUrl: 'https://example.com/corsa',
                categoryUrl: 'https://example.com/corsa/engine',
                subCategoryUrl: 'https://example.com/corsa/engine/oil',
                scrapedAt: new Date()
            },

            // Corsa - Suspension
            {
                modelName: 'Opel Corsa',
                categoryName: 'Suspension',
                subCategoryName: 'Shock Absorbers',
                partName: 'Front Shock Absorber',
                oemNumber: 'OP-SHOCK-001',
                description: 'Front suspension shock absorber',
                imageUrl: 'https://via.placeholder.com/150?text=Shock',
                modelUrl: 'https://example.com/corsa',
                categoryUrl: 'https://example.com/corsa/suspension',
                subCategoryUrl: 'https://example.com/corsa/suspension/shocks',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Corsa',
                categoryName: 'Suspension',
                subCategoryName: 'Shock Absorbers',
                partName: 'Rear Shock Absorber',
                oemNumber: 'OP-SHOCK-002',
                description: 'Rear suspension shock absorber',
                imageUrl: 'https://via.placeholder.com/150?text=Shock',
                modelUrl: 'https://example.com/corsa',
                categoryUrl: 'https://example.com/corsa/suspension',
                subCategoryUrl: 'https://example.com/corsa/suspension/shocks',
                scrapedAt: new Date()
            },

            // Insignia - Engine
            {
                modelName: 'Opel Insignia',
                categoryName: 'Engine',
                subCategoryName: 'Turbocharger',
                partName: 'Turbocharger Assembly',
                oemNumber: 'OP-TURBO-001',
                description: 'Complete turbocharger assembly for diesel engines',
                imageUrl: 'https://via.placeholder.com/150?text=Turbo',
                modelUrl: 'https://example.com/insignia',
                categoryUrl: 'https://example.com/insignia/engine',
                subCategoryUrl: 'https://example.com/insignia/engine/turbo',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Insignia',
                categoryName: 'Engine',
                subCategoryName: 'Oil & Filters',
                partName: 'Engine Oil Filter',
                oemNumber: 'OP-OIL-003',
                description: 'Premium engine oil filter for V6 engines',
                imageUrl: 'https://via.placeholder.com/150?text=Oil+Filter',
                modelUrl: 'https://example.com/insignia',
                categoryUrl: 'https://example.com/insignia/engine',
                subCategoryUrl: 'https://example.com/insignia/engine/oil',
                scrapedAt: new Date()
            },

            // Insignia - Brakes
            {
                modelName: 'Opel Insignia',
                categoryName: 'Brakes',
                subCategoryName: 'Disc Pads',
                partName: 'Front Brake Pads',
                oemNumber: 'OP-BRAKE-001',
                description: 'Ceramic front brake pads with noise reduction',
                imageUrl: 'https://via.placeholder.com/150?text=Brake+Pads',
                modelUrl: 'https://example.com/insignia',
                categoryUrl: 'https://example.com/insignia/brakes',
                subCategoryUrl: 'https://example.com/insignia/brakes/pads',
                scrapedAt: new Date()
            },
            {
                modelName: 'Opel Insignia',
                categoryName: 'Brakes',
                subCategoryName: 'Disc Pads',
                partName: 'Rear Brake Pads',
                oemNumber: 'OP-BRAKE-002',
                description: 'Ceramic rear brake pads',
                imageUrl: 'https://via.placeholder.com/150?text=Brake+Pads',
                modelUrl: 'https://example.com/insignia',
                categoryUrl: 'https://example.com/insignia/brakes',
                subCategoryUrl: 'https://example.com/insignia/brakes/pads',
                scrapedAt: new Date()
            }
        ];

        console.log(`[SEED] Inserting ${sampleParts.length} sample parts...`);
        await ScrapedPart.insertMany(sampleParts);
        console.log(`✅ Inserted ${sampleParts.length} parts`);

        // Verify insertion
        const count = await ScrapedPart.countDocuments();
        const models = await ScrapedPart.find({}, 'modelName').distinct('modelName');
        const categories = await ScrapedPart.find({}, 'categoryName').distinct('categoryName');

        console.log('\n📊 Database Summary:');
        console.log(`   Total parts: ${count}`);
        console.log(`   Models: ${models.join(', ')}`);
        console.log(`   Categories: ${categories.join(', ')}`);

        console.log('\n✅ Database seeding complete!');

    } catch (error) {
        console.error('❌ Seeding error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

seedDatabase();
