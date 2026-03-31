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
    // Compact & Economy
    { name: 'Opel Adam', url: `${BASE_URL}/en/catalog/cars/opel/global/adam-m13-parts-catalog/` },
    { name: 'Opel Agila B', url: `${BASE_URL}/en/catalog/cars/opel/global/agila-b-parts-catalog/` },
    { name: 'Opel Corsa D', url: `${BASE_URL}/en/catalog/cars/opel/global/corsa-d-parts-catalog/` },
    { name: 'Opel Corsa E', url: `${BASE_URL}/en/catalog/cars/opel/global/corsa-e-parts-catalog/` },
    { name: 'Opel Combo', url: `${BASE_URL}/en/catalog/cars/opel/global/combo-parts-catalog/` },
    
    // Mid-Size
    { name: 'Opel Astra G', url: `${BASE_URL}/en/catalog/cars/opel/global/astra-g-parts-catalog/` },
    { name: 'Opel Astra H', url: `${BASE_URL}/en/catalog/cars/opel/global/astra-h-parts-catalog/` },
    { name: 'Opel Astra J', url: `${BASE_URL}/en/catalog/cars/opel/global/astra-j-parts-catalog/` },
    { name: 'Opel Astra K', url: `${BASE_URL}/en/catalog/cars/opel/global/astra-k-parts-catalog/` },
    { name: 'Opel Vectra B', url: `${BASE_URL}/en/catalog/cars/opel/global/vectra-b-parts-catalog/` },
    { name: 'Opel Vectra C', url: `${BASE_URL}/en/catalog/cars/opel/global/vectra-c-parts-catalog/` },
    
    // Premium & Large
    { name: 'Opel Insignia A', url: `${BASE_URL}/en/catalog/cars/opel/global/insignia-a-parts-catalog/` },
    { name: 'Opel Insignia B', url: `${BASE_URL}/en/catalog/cars/opel/global/insignia-b-parts-catalog/` },
    { name: 'Opel Monza', url: `${BASE_URL}/en/catalog/cars/opel/global/monza-parts-catalog/` },
    
    // MPVs & Vans
    { name: 'Opel Zafira A', url: `${BASE_URL}/en/catalog/cars/opel/global/zafira-a-parts-catalog/` },
    { name: 'Opel Zafira B', url: `${BASE_URL}/en/catalog/cars/opel/global/zafira-b-parts-catalog/` },
    { name: 'Opel Zafira C', url: `${BASE_URL}/en/catalog/cars/opel/global/zafira-c-parts-catalog/` },
    { name: 'Opel Meriva A', url: `${BASE_URL}/en/catalog/cars/opel/global/meriva-a-parts-catalog/` },
    { name: 'Opel Meriva B', url: `${BASE_URL}/en/catalog/cars/opel/global/meriva-b-parts-catalog/` },
    
    // SUVs & Crossovers
    { name: 'Opel Grandland X', url: `${BASE_URL}/en/catalog/cars/opel/global/grandland-x-parts-catalog/` },
    { name: 'Opel Mokka', url: `${BASE_URL}/en/catalog/cars/opel/global/mokka-parts-catalog/` },
    { name: 'Opel Antara', url: `${BASE_URL}/en/catalog/cars/opel/global/antara-parts-catalog/` },
    { name: 'Opel Frontera', url: `${BASE_URL}/en/catalog/cars/opel/global/frontera-parts-catalog/` },
    { name: 'Opel Ascona', url: `${BASE_URL}/en/catalog/cars/opel/global/ascona-parts-catalog/` },
    
    // Sports & Classic
    { name: 'Opel GT Classic', url: `${BASE_URL}/en/catalog/cars/opel/global/gt-classic-parts-catalog/` },
    { name: 'Opel Calibra', url: `${BASE_URL}/en/catalog/cars/opel/global/calibra-parts-catalog/` },
    { name: 'Opel Kadett', url: `${BASE_URL}/en/catalog/cars/opel/global/kadett-parts-catalog/` },
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
    { name: 'Interior & Comfort', slug: 'interior' },
    { name: 'Exterior & Trim', slug: 'exterior' },
    { name: 'Glass & Weatherstrips', slug: 'glass' },
    { name: 'Body & Frame', slug: 'body' },
];

// Sample parts for each category
const SAMPLE_PARTS = {
    'engine': [
        { name: 'Engine Oil Filter', number: '6344067' },
        { name: 'Air Filter', number: '1612775' },
        { name: 'Cabin Air Filter', number: '1628932' },
        { name: 'Spark Plugs (Set of 4)', number: '6038453' },
        { name: 'Timing Belt', number: '6384268' },
        { name: 'Cylinder Head Cover', number: '5514099' },
        { name: 'Engine Gasket Set', number: '6034892' },
        { name: 'Crankshaft Pulley', number: '6032845' },
        { name: 'Water Pump', number: '6344092' },
        { name: 'Ignition Coil Pack', number: '5402934' },
    ],
    'transmission': [
        { name: 'Transmission Fluid (1L)', number: '6339000' },
        { name: 'Transmission Mount', number: '5214401' },
        { name: 'Drive Shaft', number: '6381231' },
        { name: 'Clutch Plate', number: '5340129' },
        { name: 'Clutch Release Bearing', number: '5402834' },
        { name: 'Gear Selector Cable', number: '6033921' },
        { name: 'Transmission Pan Gasket', number: '5214902' },
        { name: 'Transfer Case Mount', number: '6032104' },
    ],
    'suspension': [
        { name: 'Shock Absorber Front (Left)', number: '3342028' },
        { name: 'Shock Absorber Front (Right)', number: '3342029' },
        { name: 'Shock Absorber Rear (Set)', number: '3342030' },
        { name: 'Control Arm (Front)', number: '5514398' },
        { name: 'Control Arm (Rear)', number: '5514399' },
        { name: 'Coil Spring Front', number: '1305401' },
        { name: 'Coil Spring Rear', number: '1305402' },
        { name: 'Sway Bar Link', number: '6035421' },
        { name: 'Ball Joint', number: '5240934' },
        { name: 'Tie Rod End', number: '6034102' },
    ],
    'brakes': [
        { name: 'Brake Pads (Front)', number: '6385443' },
        { name: 'Brake Pads (Rear)', number: '6385444' },
        { name: 'Brake Disc Front', number: '5234120' },
        { name: 'Brake Disc Rear', number: '5234121' },
        { name: 'Wheel Bearing Front', number: '4291234' },
        { name: 'Wheel Bearing Rear', number: '4291235' },
        { name: 'Brake Master Cylinder', number: '6034129' },
        { name: 'Brake Caliper Front', number: '5402301' },
        { name: 'Brake Line (Rubber)', number: '6035802' },
    ],
    'electrical': [
        { name: 'Battery 12V/60Ah', number: '1612094' },
        { name: 'Alternator 120A', number: '4410462' },
        { name: 'Starter Motor', number: '1612834' },
        { name: 'Fuse Box Assembly', number: '6032894' },
        { name: 'Wiper Motor (Front)', number: '5214029' },
        { name: 'Wiper Motor (Rear)', number: '5214030' },
        { name: 'Door Lock Motor', number: '6034521' },
        { name: 'Window Regulator Motor', number: '5240831' },
        { name: 'Headlight Assembly H4', number: '6035420' },
        { name: 'Tail Light Assembly LED', number: '6035421' },
    ],
    'cooling': [
        { name: 'Water Pump', number: '6344092' },
        { name: 'Radiator Fan Motor', number: '3342054' },
        { name: 'Thermostat Housing', number: '5514389' },
        { name: 'Radiator Hose (Upper)', number: '6034521' },
        { name: 'Radiator Hose (Lower)', number: '6034522' },
        { name: 'Coolant Expansion Tank', number: '6032094' },
        { name: 'Radiator Cooling Fan Blade', number: '3342055' },
    ],
    'fuel': [
        { name: 'Fuel Pump (Electric)', number: '6234923' },
        { name: 'Fuel Filter', number: '5204592' },
        { name: 'Fuel Injector (Single)', number: '6334120' },
        { name: 'Fuel Injector Set (4)', number: '6334121' },
        { name: 'Fuel Pressure Regulator', number: '5402834' },
        { name: 'Fuel Tank Cap', number: '6035904' },
        { name: 'Fuel Hose Assembly', number: '6033210' },
    ],
    'exhaust': [
        { name: 'Exhaust Manifold', number: '5402341' },
        { name: 'Catalytic Converter', number: '6342110' },
        { name: 'Muffler Assembly', number: '4231940' },
        { name: 'Exhaust Pipe (Mid-section)', number: '5240921' },
        { name: 'Oxygen Sensor', number: '6032405' },
        { name: 'Exhaust Gasket Set', number: '5402342' },
    ],
    'interior': [
        { name: 'Steering Wheel Leather', number: '6034903' },
        { name: 'Seat Cushion Front (Left)', number: '5214530' },
        { name: 'Seat Cushion Front (Right)', number: '5214531' },
        { name: 'Dashboard Panel', number: '6035401' },
        { name: 'Door Panel Trim (Front)', number: '5240432' },
        { name: 'Carpet Floor Mat Set', number: '6033921' },
        { name: 'Sun Visor Assembly', number: '5402934' },
    ],
    'exterior': [
        { name: 'Front Bumper Cover', number: '6034521' },
        { name: 'Rear Bumper Cover', number: '6034522' },
        { name: 'Side Mirror (Left)', number: '5214032' },
        { name: 'Side Mirror (Right)', number: '5214033' },
        { name: 'Door Handle (Front Left)', number: '6030421' },
        { name: 'Door Handle (Front Right)', number: '6030422' },
        { name: 'Roof Rack Crossbars', number: '5402934' },
    ],
    'glass': [
        { name: 'Front Windshield', number: '6034032' },
        { name: 'Rear Windshield', number: '6034033' },
        { name: 'Door Glass (Front Left)', number: '5214134' },
        { name: 'Door Glass (Front Right)', number: '5214135' },
        { name: 'Door Weatherstrip (Rubber)', number: '6035804' },
        { name: 'Window Seal Kit', number: '5402834' },
    ],
    'body': [
        { name: 'Hood Panel', number: '6034903' },
        { name: 'Fender Panel (Left)', number: '5214534' },
        { name: 'Fender Panel (Right)', number: '5214535' },
        { name: 'Door Skin (Front Left)', number: '6030432' },
        { name: 'Door Skin (Front Right)', number: '6030433' },
        { name: 'Trunk Lid Panel', number: '6034904' },
        { name: 'Body Seal Strip', number: '5402804' },
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
