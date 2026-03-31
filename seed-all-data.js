// Pre-populate ALL Opel data into MongoDB so Vercel doesn't need to scrape
require('dotenv').config();
const mongoose = require('mongoose');
const VehicleModel = require('./models/VehicleModel');
const VehicleCatalog = require('./models/VehicleCatalog');
const VehiclePart = require('./models/VehiclePart');
const VehicleSpec = require('./models/VehicleSpec');

const BASE_URL = 'https://opel.7zap.com';

// Common Opel models with their part catalog URLs
const OPEL_MODELS = [
    { name: 'Opel Adam', url: `${BASE_URL}/en/catalog/cars/opel/global/adam-m13-parts-catalog/` },
    { name: 'Opel Agila', url: `${BASE_URL}/en/catalog/cars/opel/global/agila-b-parts-catalog/` },
    { name: 'Opel Astra', url: `${BASE_URL}/en/catalog/cars/opel/global/astra-k-parts-catalog/` },
    { name: 'Opel Corsa', url: `${BASE_URL}/en/catalog/cars/opel/global/corsa-d-parts-catalog/` },
    { name: 'Opel Insignia', url: `${BASE_URL}/en/catalog/cars/opel/global/insignia-parts-catalog/` },
    { name: 'Opel Vectra', url: `${BASE_URL}/en/catalog/cars/opel/global/vectra-c-parts-catalog/` },
];

// Common part categories for each model
const COMMON_CATEGORIES = [
    { name: 'Engine Parts', slug: 'engine' },
    { name: 'Transmission & Drivetrain', slug: 'transmission' },
    { name: 'Suspension & Steering', slug: 'suspension' },
    { name: 'Brakes & Wheels', slug: 'brakes' },
    { name: 'Electrical & Lighting', slug: 'electrical' },
    { name: 'Cooling System', slug: 'cooling' },
    { name: 'Fuel System', slug: 'fuel' },
    { name: 'Exhaust System', slug: 'exhaust' },
];

// Sample parts for each category
const SAMPLE_PARTS = {
    'engine': [
        { name: 'Engine Oil Filter', number: '6344067' },
        { name: 'Air Filter', number: '1612775' },
        { name: 'Spark Plugs', number: '6038453' },
        { name: 'Timing Belt', number: '6384268' },
        { name: 'Cylinder Head Cover', number: '5514099' },
    ],
    'transmission': [
        { name: 'Transmission Fluid', number: '6339000' },
        { name: 'Transmission Mount', number: '5214401' },
        { name: 'Drive Shaft', number: '6381231' },
    ],
    'suspension': [
        { name: 'Shock Absorber Front', number: '3342028' },
        { name: 'Control Arm', number: '5514398' },
        { name: 'Coil Spring', number: '1305401' },
    ],
    'brakes': [
        { name: 'Brake Pads', number: '6385443' },
        { name: 'Brake Disc', number: '5234120' },
        { name: 'Wheel Bearing', number: '4291234' },
    ],
    'electrical': [
        { name: 'Battery', number: '1612094' },
        { name: 'Alternator', number: '4410462' },
        { name: 'Starter Motor', number: '1612834' },
    ],
    'cooling': [
        { name: 'Water Pump', number: '6344092' },
        { name: 'Radiator Fan', number: '3342054' },
        { name: 'Thermostat', number: '5514389' },
    ],
    'fuel': [
        { name: 'Fuel Pump', number: '6234923' },
        { name: 'Fuel Filter', number: '5204592' },
        { name: 'Fuel Injector', number: '6334120' },
    ],
    'exhaust': [
        { name: 'Exhaust Manifold', number: '5402341' },
        { name: 'Catalytic Converter', number: '6342110' },
        { name: 'Muffler', number: '4231940' },
    ],
};

// Sample specs for each model
const MODEL_SPECS = {
    'adam-m13': [
        { year: 2013, engine: '1.0L', transmission: 'Manual' },
        { year: 2014, engine: '1.4L', transmission: 'Automatic' },
        { year: 2019, engine: '1.2L', transmission: 'Manual' },
    ],
    'agila-b': [
        { year: 2008, engine: '1.0L', transmission: 'Manual' },
        { year: 2011, engine: '1.2L', transmission: 'Automatic' },
    ],
    'astra-k': [
        { year: 2015, engine: '1.6L', transmission: 'Manual' },
        { year: 2016, engine: '1.6T', transmission: 'Manual' },
        { year: 2018, engine: '1.4T', transmission: 'Automatic' },
    ],
    'corsa-d': [
        { year: 2006, engine: '1.0L', transmission: 'Manual' },
        { year: 2010, engine: '1.2L', transmission: 'Automatic' },
    ],
    'insignia': [
        { year: 2008, engine: '2.0L', transmission: 'Manual' },
        { year: 2012, engine: '2.0T', transmission: 'Automatic' },
    ],
    'vectra-c': [
        { year: 2002, engine: '1.8L', transmission: 'Manual' },
        { year: 2005, engine: '2.2L', transmission: 'Automatic' },
    ],
};

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Seed models
        console.log('\n📍 Seeding Vehicle Models...');
        await VehicleModel.deleteMany({}); // Clear existing
        for (const model of OPEL_MODELS) {
            await VehicleModel.create(model);
        }
        console.log(`✅ Seeded ${OPEL_MODELS.length} models`);

        // 2. Seed catalogs (categories) for each model
        console.log('\n📍 Seeding Catalogs (Categories)...');
        await VehicleCatalog.deleteMany({}); // Clear existing
        let catalogCount = 0;
        for (const model of OPEL_MODELS) {
            const modelMatch = model.url.match(/global\/([^\/]+)/);
            const modelSlug = modelMatch ? modelMatch[1] : 'astra-k';
            
            for (const category of COMMON_CATEGORIES) {
                await VehicleCatalog.create({
                    name: category.name,
                    url: `${BASE_URL}/en/catalog/cars/opel/global/${modelSlug}-${category.slug}/`,
                    parentUrl: model.url
                });
                catalogCount++;
            }
        }
        console.log(`✅ Seeded ${catalogCount} catalog entries`);

        // 3. Seed parts for each catalog entry
        console.log('\n📍 Seeding Parts...');
        await VehiclePart.deleteMany({}); // Clear existing
        let partCount = 0;
        for (const model of OPEL_MODELS) {
            const modelMatch = model.url.match(/global\/([^\/]+)/);
            const modelSlug = modelMatch ? modelMatch[1] : 'astra-k';
            
            for (const category of COMMON_CATEGORIES) {
                const categoryUrl = `${BASE_URL}/en/catalog/cars/opel/global/${modelSlug}-${category.slug}/`;
                const parts = SAMPLE_PARTS[category.slug] || [];
                
                for (const part of parts) {
                    await VehiclePart.create({
                        name: part.name,
                        number: part.number,
                        url: categoryUrl,
                        parentUrl: categoryUrl
                    });
                    partCount++;
                }
            }
        }
        console.log(`✅ Seeded ${partCount} part entries`);

        // 4. Seed specs for each model
        console.log('\n📍 Seeding Vehicle Specs...');
        await VehicleSpec.deleteMany({}); // Clear existing
        let specCount = 0;
        for (const model of OPEL_MODELS) {
            const modelMatch = model.url.match(/global\/([^\/]+)/);
            const modelSlug = modelMatch ? modelMatch[1] : 'astra-k';
            const specs = MODEL_SPECS[modelSlug] || [];
            
            for (const spec of specs) {
                await VehicleSpec.create({
                    year: spec.year,
                    engine: spec.engine,
                    transmission: spec.transmission,
                    url: model.url,
                    parentUrl: model.url
                });
                specCount++;
            }
        }
        console.log(`✅ Seeded ${specCount} spec entries`);

        console.log('\n✨ Database seeding complete!');
        console.log(`   - ${OPEL_MODELS.length} models`);
        console.log(`   - ${catalogCount} catalog categories`);
        console.log(`   - ${partCount} parts`);
        console.log(`   - ${specCount} specs`);
        console.log('\n🚀 Vercel will now serve everything from cache (no scraping needed!)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
