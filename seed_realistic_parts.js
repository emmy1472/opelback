/**
 * Seed Data Generator - Realistic Opel OEM Parts
 * 
 * Generates 5,000+ realistic OEM parts for Corsa, Astra, Mokka
 * with proper database relationships and part numbers
 */

const mongoose = require('mongoose');
const config = require('./config');
require('dotenv').config();

// Import models
const {
  VehicleModel,
  VehicleSpec,
  VehicleCatalog,
  VehiclePart
} = require('./models');

// OEM Part Number Patterns and Categories
const partCategories = {
  corsa: [
    { categoryId: 'engine', categoryName: 'Engine & Components' },
    { categoryId: 'transmission', categoryName: 'Transmission & Drivetrain' },
    { categoryId: 'suspension', categoryName: 'Suspension & Steering' },
    { categoryId: 'brakes', categoryName: 'Brakes & Brake System' },
    { categoryId: 'electrical', categoryName: 'Electrical & Battery' },
    { categoryId: 'cooling', categoryName: 'Cooling & Air Conditioning' },
    { categoryId: 'fuel', categoryName: 'Fuel System & Injection' },
    { categoryId: 'lighting', categoryName: 'Lighting & Electrical' }
  ],
  astra: [
    { categoryId: 'engine', categoryName: 'Engine & Components' },
    { categoryId: 'transmission', categoryName: 'Transmission & Drivetrain' },
    { categoryId: 'suspension', categoryName: 'Suspension & Steering' },
    { categoryId: 'brakes', categoryName: 'Brakes & Brake System' },
    { categoryId: 'electrical', categoryName: 'Electrical & Battery' },
    { categoryId: 'cooling', categoryName: 'Cooling & Air Conditioning' },
    { categoryId: 'fuel', categoryName: 'Fuel System & Injection' },
    { categoryId: 'lighting', categoryName: 'Lighting & Electrical' },
    { categoryId: 'interior', categoryName: 'Interior & Trim' },
    { categoryId: 'exterior', categoryName: 'Exterior & Body' }
  ],
  mokka: [
    { categoryId: 'engine', categoryName: 'Engine & Components' },
    { categoryId: 'transmission', categoryName: 'Transmission & Drivetrain' },
    { categoryId: 'suspension', categoryName: 'Suspension & Steering (SUV)' },
    { categoryId: 'brakes', categoryName: 'Brakes & Brake System' },
    { categoryId: 'electrical', categoryName: 'Electrical & Battery' },
    { categoryId: 'cooling', categoryName: 'Cooling & Air Conditioning' },
    { categoryId: 'fuel', categoryName: 'Fuel System & Injection' },
    { categoryId: 'lighting', categoryName: 'Lighting & Electrical' },
    { categoryId: 'awd', categoryName: 'All-Wheel Drive System' },
    { categoryId: 'exterior', categoryName: 'Exterior & Body (SUV)' }
  ]
};

// Realistic Opel OEM part numbers and descriptions
const partTemplates = {
  engine: [
    { prefix: '1628', desc: 'Cylinder Head Gasket', type: 'gasket' },
    { prefix: '1620', desc: 'Engine Block Assembly', type: 'block' },
    { prefix: '1623', desc: 'Piston Ring Set', type: 'rings' },
    { prefix: '1625', desc: 'Crankshaft Assembly', type: 'crankshaft' },
    { prefix: '1627', desc: 'Camshaft Assembly', type: 'camshaft' },
    { prefix: '6231', desc: 'Spark Plug Set', type: 'sparkplugs' },
    { prefix: '5644', desc: 'Engine Oil Filter', type: 'filter' },
    { prefix: '1633', desc: 'Valve Cover Gasket', type: 'gasket' },
    { prefix: '1635', desc: 'Timing Chain', type: 'chain' },
    { prefix: '1637', desc: 'Engine Mount', type: 'mount' }
  ],
  transmission: [
    { prefix: '2410', desc: 'Automatic Transmission Assembly', type: 'trans' },
    { prefix: '2411', desc: 'Manual Transmission Assembly', type: 'trans' },
    { prefix: '2420', desc: 'Clutch Disc', type: 'clutch' },
    { prefix: '2421', desc: 'Pressure Plate', type: 'clutch' },
    { prefix: '2430', desc: 'Drive Shaft Assembly', type: 'shaft' },
    { prefix: '2435', desc: 'Universal Joint', type: 'joint' },
    { prefix: '2440', desc: 'Differential Assembly', type: 'differential' },
    { prefix: '2445', desc: 'Transmission Mount', type: 'mount' },
    { prefix: '2450', desc: 'Transmission Fluid Filter', type: 'filter' },
    { prefix: '2455', desc: 'Torque Converter', type: 'converter' }
  ],
  suspension: [
    { prefix: '3110', desc: 'Shock Absorber Front', type: 'shock' },
    { prefix: '3111', desc: 'Shock Absorber Rear', type: 'shock' },
    { prefix: '3120', desc: 'Spring Coil Front', type: 'spring' },
    { prefix: '3121', desc: 'Spring Coil Rear', type: 'spring' },
    { prefix: '3130', desc: 'Control Arm Assembly', type: 'arm' },
    { prefix: '3140', desc: 'Ball Joint Assembly', type: 'joint' },
    { prefix: '3150', desc: 'Tie Rod End', type: 'rod' },
    { prefix: '3160', desc: 'Steering Rack Assembly', type: 'rack' },
    { prefix: '3170', desc: 'Wheel Bearing', type: 'bearing' },
    { prefix: '3180', desc: 'Suspension Bush Kit', type: 'bush' }
  ],
  brakes: [
    { prefix: '4410', desc: 'Front Brake Pad Set', type: 'pads' },
    { prefix: '4411', desc: 'Rear Brake Pad Set', type: 'pads' },
    { prefix: '4420', desc: 'Front Brake Rotor', type: 'rotor' },
    { prefix: '4421', desc: 'Rear Brake Rotor', type: 'rotor' },
    { prefix: '4430', desc: 'Front Brake Caliper', type: 'caliper' },
    { prefix: '4431', desc: 'Rear Brake Caliper', type: 'caliper' },
    { prefix: '4440', desc: 'Brake Hose Assembly', type: 'hose' },
    { prefix: '4450', desc: 'Brake Master Cylinder', type: 'cylinder' },
    { prefix: '4460', desc: 'Brake Fluid Reservoir', type: 'reservoir' },
    { prefix: '4470', desc: 'ABS Module Assembly', type: 'abs' }
  ],
  electrical: [
    { prefix: '5510', desc: 'Alternator 120A', type: 'alternator' },
    { prefix: '5511', desc: 'Alternator 150A', type: 'alternator' },
    { prefix: '5520', desc: 'Starter Motor', type: 'starter' },
    { prefix: '5530', desc: 'Battery 60Ah', type: 'battery' },
    { prefix: '5531', desc: 'Battery 75Ah', type: 'battery' },
    { prefix: '5540', desc: 'ECU Control Module', type: 'ecu' },
    { prefix: '5550', desc: 'Power Window Motor', type: 'motor' },
    { prefix: '5560', desc: 'Fuel Pump Motor', type: 'pump' },
    { prefix: '5570', desc: 'Wiper Motor Front', type: 'wiper' },
    { prefix: '5580', desc: 'Oxygen Sensor', type: 'sensor' }
  ],
  cooling: [
    { prefix: '6110', desc: 'Water Pump Assembly', type: 'pump' },
    { prefix: '6111', desc: 'Thermostat Assembly', type: 'thermostat' },
    { prefix: '6120', desc: 'Radiator Core Assembly', type: 'radiator' },
    { prefix: '6130', desc: 'AC Condenser', type: 'condenser' },
    { prefix: '6140', desc: 'AC Compressor', type: 'compressor' },
    { prefix: '6150', desc: 'Fan Clutch Assembly', type: 'clutch' },
    { prefix: '6160', desc: 'Electric Cooling Fan', type: 'fan' },
    { prefix: '6170', desc: 'Refrigerant Hose', type: 'hose' },
    { prefix: '6180', desc: 'Heater Core Assembly', type: 'heater' },
    { prefix: '6190', desc: 'Expansion Tank', type: 'tank' }
  ],
  fuel: [
    { prefix: '7210', desc: 'Fuel Injector Single', type: 'injector' },
    { prefix: '7211', desc: 'Fuel Injector Rail', type: 'rail' },
    { prefix: '7220', desc: 'Fuel Filter Cartridge', type: 'filter' },
    { prefix: '7230', desc: 'Fuel Pressure Regulator', type: 'regulator' },
    { prefix: '7240', desc: 'Fuel Tank Assembly', type: 'tank' },
    { prefix: '7250', desc: 'Fuel Pump Assembly In-Tank', type: 'pump' },
    { prefix: '7260', desc: 'Fuel Line Hose', type: 'hose' },
    { prefix: '7270', desc: 'Fuel Filler Neck', type: 'neck' },
    { prefix: '7280', desc: 'Fuel Sender Unit', type: 'sender' },
    { prefix: '7290', desc: 'Muffler Assembly', type: 'muffler' }
  ],
  lighting: [
    { prefix: '8110', desc: 'Headlight Bulb H7', type: 'bulb' },
    { prefix: '8111', desc: 'Headlight Bulb H1', type: 'bulb' },
    { prefix: '8120', desc: 'Tail Light LED Assembly', type: 'tail' },
    { prefix: '8130', desc: 'Fog Light Bulb', type: 'bulb' },
    { prefix: '8140', desc: 'Interior Dome Light', type: 'dome' },
    { prefix: '8150', desc: 'License Plate Light', type: 'plate' },
    { prefix: '8160', desc: 'Side Turn Signal', type: 'signal' },
    { prefix: '8170', desc: 'Brake Light Switch', type: 'switch' },
    { prefix: '8180', desc: 'Headlight Assembly Housing', type: 'housing' },
    { prefix: '8190', desc: 'Rear Combination Lamp', type: 'lamp' }
  ],
  interior: [
    { prefix: '9110', desc: 'Dashboard Trim Panel', type: 'trim' },
    { prefix: '9120', desc: 'Door Panel Interior', type: 'panel' },
    { prefix: '9130', desc: 'Steering Wheel Leather', type: 'wheel' },
    { prefix: '9140', desc: 'Seat Cushion Front', type: 'seat' },
    { prefix: '9150', desc: 'Headrest Assembly', type: 'headrest' },
    { prefix: '9160', desc: 'Floor Mat Set', type: 'mats' },
    { prefix: '9170', desc: 'Sun Visor Assembly', type: 'visor' },
    { prefix: '9180', desc: 'Cup Holder Assembly', type: 'holder' },
    { prefix: '9190', desc: 'Center Console Panel', type: 'console' }
  ],
  exterior: [
    { prefix: '10110', desc: 'Bumper Front Assembly', type: 'bumper' },
    { prefix: '10111', desc: 'Bumper Rear Assembly', type: 'bumper' },
    { prefix: '10120', desc: 'Door Handle Exterior', type: 'handle' },
    { prefix: '10130', desc: 'Window Glass Front Door', type: 'glass' },
    { prefix: '10140', desc: 'Weather Stripping Door', type: 'seal' },
    { prefix: '10150', desc: 'Molding Trim Body', type: 'molding' },
    { prefix: '10160', desc: 'Bumper Guard Chrome', type: 'guard' },
    { prefix: '10170', desc: 'Roof Rails Assembly', type: 'rails' },
    { prefix: '10180', desc: 'Fender Outer Panel', type: 'fender' },
    { prefix: '10190', desc: 'Hood Latch Assembly', type: 'latch' }
  ],
  awd: [
    { prefix: '11110', desc: 'AWD Transfer Case', type: 'case' },
    { prefix: '11120', desc: 'Front Axle Assembly AWD', type: 'axle' },
    { prefix: '11130', desc: 'Rear Axle Assembly AWD', type: 'axle' },
    { prefix: '11140', desc: 'AWD Coupling Unit', type: 'coupling' },
    { prefix: '11150', desc: 'Differential Lock Actuator', type: 'actuator' },
    { prefix: '11160', desc: 'Power Transfer Unit', type: 'ptu' },
    { prefix: '11170', desc: 'Front Drive Shaft', type: 'shaft' }
  ]
};

async function generateAndSeedParts() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ Seeding Realistic Opel OEM Parts Data                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create models
    const models = await VehicleModel.find();
    if (models.length === 0) {
      console.log('❌ No models found. Please run master-scraper-v2.js first to create models.');
      process.exit(1);
    }

    let totalPartsCreated = 0;

    for (const model of models) {
      const modelKey = model.modelId;
      const categories = partCategories[modelKey] || partCategories.corsa;

      console.log(`\n📦 Processing ${model.name} (${model.modelId})`);
      console.log(`   Categories: ${categories.length}`);

      let modelPartCount = 0;

      for (const category of categories) {
        const templates = partTemplates[category.categoryId] || partTemplates.engine;
        const partsPerTemplate = 15; // 15 variations per template = ~150 parts per category
        const parts = [];

        for (const template of templates) {
          for (let i = 0; i < partsPerTemplate; i++) {
            // Generate unique OEM part numbers
            const suffix = String(i + 1).padStart(3, '0');
            const variant = String(Math.floor(Math.random() * 900) + 100);
            const partNumber = `${template.prefix}-${variant}-${suffix}`;

            // Generate part name variations
            const variations = ['Standard', 'Reinforced', 'OE Grade', 'Premium', 'Sport'];
            const variation = variations[i % variations.length];

            parts.push({
              partNumber: partNumber,
              name: `${variation} ${template.desc} (${model.name})`,
              categoryId: category.categoryId,
              modelId: model.modelId,
              description: `${template.desc} - Genuine Opel OEM Part for ${model.name}. Top-quality component ensuring superior performance and longevity.`,
              quantity: Math.floor(Math.random() * 100) + 1,
              specifications: {
                weight: `${(Math.random() * 5 + 0.5).toFixed(2)} kg`,
                material: ['Steel', 'Aluminum', 'Composite', 'Rubber', 'Plastic'][Math.floor(Math.random() * 5)],
                condition: 'New',
                warranty: `${Math.floor(Math.random() * 36) + 12} months`,
                oem_reference: `GM ${template.prefix}`,
                manufacturing_date: new Date(2023 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
              },
              compatibility: {
                models: [model.name],
                years: Array.from(
                  { length: Math.floor(Math.random() * 5) + 3 },
                  (_, i) => new Date().getFullYear() - Math.floor(Math.random() * 10) - i
                ),
                engines: ['1.0L Turbo', '1.2L', '1.4L Turbo', '1.6L', '1.8L'].slice(0, Math.floor(Math.random() * 4) + 1),
                transmissions: ['Manual', 'Automatic', 'CVT'].slice(0, Math.floor(Math.random() * 3) + 1)
              },
              pricing: {
                oem: parseFloat((Math.random() * 500 + 20).toFixed(2)),
                aftermarket: parseFloat((Math.random() * 400 + 15).toFixed(2)),
                currency: 'EUR',
                last_updated: new Date()
              },
              imageUrl: `https://opel-parts.example.com/images/${partNumber}.jpg`,
              externalLinks: {
                oem: `https://parts.opel.com/parts/${partNumber}`,
                image: `https://opel-parts.example.com/images/${partNumber}.jpg`,
                manual: `https://opel-parts.example.com/manuals/${category.categoryId}.pdf`
              },
              stock_status: ['In Stock', 'Limited Stock', 'Pre-Order', 'Discontinued'][Math.floor(Math.random() * 4)],
              supplier: ['Opel Official', 'Authorized Dealer', 'Parts Center'][Math.floor(Math.random() * 3)]
            });
          }
        }

        // Save parts in batches
        try {
          await VehiclePart.insertMany(parts, { ordered: false }).catch(e => {
            if (e.code !== 11000) throw e; // Ignore duplicate key errors
          });
          console.log(`   ✅ ${category.categoryName}: ${parts.length} parts`);
          modelPartCount += parts.length;
        } catch (error) {
          console.error(`   ⚠️  ${category.categoryName}: ${error.message}`);
        }
      }

      console.log(`   📊 Total for ${model.name}: ${modelPartCount} parts`);
      totalPartsCreated += modelPartCount;
    }

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ ✅ Seeding Complete!                                  ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║ Total Parts Created: ${String(totalPartsCreated).padStart(27)} ║`);
    console.log(`║ Models: 3 | Categories: ~24 | Avg Parts per Cat: ~150 ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

    // Verify data
    const totalInDB = await VehiclePart.countDocuments();
    console.log(`✅ Database verification: ${totalInDB} total parts in database`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run seeder
generateAndSeedParts();
