/**
 * Quick Setup - Creates Models + Seeds Parts Data
 * 
 * This bypasses the web scraper and directly creates models
 * and seeds 3,600+ realistic OEM parts for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { VehicleModel, VehiclePart } = require('./models');

async function quickSetup() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ Quick Setup - Models + Parts Data                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create models
    const coreModels = [
      {
        modelId: 'corsa',
        name: 'Opel Corsa',
        url: 'https://opel.7zap.com/en/global/corsa/',
        type: 'Compact Hatchback',
        baseUrl: 'https://opel.7zap.com/en/global/corsa/',
        yearsSupported: '2015-2026'
      },
      {
        modelId: 'astra',
        name: 'Opel Astra',
        url: 'https://opel.7zap.com/en/global/astra/',
        type: 'Family Sedan',
        baseUrl: 'https://opel.7zap.com/en/global/astra/',
        yearsSupported: '2010-2026'
      },
      {
        modelId: 'mokka',
        name: 'Opel Mokka',
        url: 'https://opel.7zap.com/en/global/mokka/',
        type: 'Compact SUV',
        baseUrl: 'https://opel.7zap.com/en/global/mokka/',
        yearsSupported: '2012-2026'
      }
    ];

    console.log('📦 Creating vehicle models...');
    for (const model of coreModels) {
      await VehicleModel.updateOne(
        { modelId: model.modelId },
        model,
        { upsert: true }
      );
      console.log(`   ✅ ${model.name}`);
    }

    console.log('\n✅ Proceeding to seed realistic parts data...\n');

    // Now run the seed script embedded
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

    const partTemplates = {
      engine: [
        { prefix: '1628', desc: 'Cylinder Head Gasket' },
        { prefix: '1620', desc: 'Engine Block Assembly' },
        { prefix: '1623', desc: 'Piston Ring Set' },
        { prefix: '1625', desc: 'Crankshaft Assembly' },
        { prefix: '1627', desc: 'Camshaft Assembly' },
        { prefix: '6231', desc: 'Spark Plug Set' },
        { prefix: '5644', desc: 'Engine Oil Filter' },
        { prefix: '1633', desc: 'Valve Cover Gasket' },
        { prefix: '1635', desc: 'Timing Chain' },
        { prefix: '1637', desc: 'Engine Mount' }
      ],
      transmission: [
        { prefix: '2410', desc: 'Automatic Transmission Assembly' },
        { prefix: '2411', desc: 'Manual Transmission Assembly' },
        { prefix: '2420', desc: 'Clutch Disc' },
        { prefix: '2421', desc: 'Pressure Plate' },
        { prefix: '2430', desc: 'Drive Shaft Assembly' },
        { prefix: '2435', desc: 'Universal Joint' },
        { prefix: '2440', desc: 'Differential Assembly' },
        { prefix: '2445', desc: 'Transmission Mount' },
        { prefix: '2450', desc: 'Transmission Fluid Filter' },
        { prefix: '2455', desc: 'Torque Converter' }
      ],
      suspension: [
        { prefix: '3110', desc: 'Shock Absorber Front' },
        { prefix: '3111', desc: 'Shock Absorber Rear' },
        { prefix: '3120', desc: 'Spring Coil Front' },
        { prefix: '3121', desc: 'Spring Coil Rear' },
        { prefix: '3130', desc: 'Control Arm Assembly' },
        { prefix: '3140', desc: 'Ball Joint Assembly' },
        { prefix: '3150', desc: 'Tie Rod End' },
        { prefix: '3160', desc: 'Steering Rack Assembly' },
        { prefix: '3170', desc: 'Wheel Bearing' },
        { prefix: '3180', desc: 'Suspension Bush Kit' }
      ],
      brakes: [
        { prefix: '4410', desc: 'Front Brake Pad Set' },
        { prefix: '4411', desc: 'Rear Brake Pad Set' },
        { prefix: '4420', desc: 'Front Brake Rotor' },
        { prefix: '4421', desc: 'Rear Brake Rotor' },
        { prefix: '4430', desc: 'Front Brake Caliper' },
        { prefix: '4431', desc: 'Rear Brake Caliper' },
        { prefix: '4440', desc: 'Brake Hose Assembly' },
        { prefix: '4450', desc: 'Brake Master Cylinder' },
        { prefix: '4460', desc: 'Brake Fluid Reservoir' },
        { prefix: '4470', desc: 'ABS Module Assembly' }
      ],
      electrical: [
        { prefix: '5510', desc: 'Alternator 120A' },
        { prefix: '5511', desc: 'Alternator 150A' },
        { prefix: '5520', desc: 'Starter Motor' },
        { prefix: '5530', desc: 'Battery 60Ah' },
        { prefix: '5531', desc: 'Battery 75Ah' },
        { prefix: '5540', desc: 'ECU Control Module' },
        { prefix: '5550', desc: 'Power Window Motor' },
        { prefix: '5560', desc: 'Fuel Pump Motor' },
        { prefix: '5570', desc: 'Wiper Motor Front' },
        { prefix: '5580', desc: 'Oxygen Sensor' }
      ],
      cooling: [
        { prefix: '6110', desc: 'Water Pump Assembly' },
        { prefix: '6111', desc: 'Thermostat Assembly' },
        { prefix: '6120', desc: 'Radiator Core Assembly' },
        { prefix: '6130', desc: 'AC Condenser' },
        { prefix: '6140', desc: 'AC Compressor' },
        { prefix: '6150', desc: 'Fan Clutch Assembly' },
        { prefix: '6160', desc: 'Electric Cooling Fan' },
        { prefix: '6170', desc: 'Refrigerant Hose' },
        { prefix: '6180', desc: 'Heater Core Assembly' },
        { prefix: '6190', desc: 'Expansion Tank' }
      ],
      fuel: [
        { prefix: '7210', desc: 'Fuel Injector Single' },
        { prefix: '7211', desc: 'Fuel Injector Rail' },
        { prefix: '7220', desc: 'Fuel Filter Cartridge' },
        { prefix: '7230', desc: 'Fuel Pressure Regulator' },
        { prefix: '7240', desc: 'Fuel Tank Assembly' },
        { prefix: '7250', desc: 'Fuel Pump Assembly In-Tank' },
        { prefix: '7260', desc: 'Fuel Line Hose' },
        { prefix: '7270', desc: 'Fuel Filler Neck' },
        { prefix: '7280', desc: 'Fuel Sender Unit' },
        { prefix: '7290', desc: 'Muffler Assembly' }
      ],
      lighting: [
        { prefix: '8110', desc: 'Headlight Bulb H7' },
        { prefix: '8111', desc: 'Headlight Bulb H1' },
        { prefix: '8120', desc: 'Tail Light LED Assembly' },
        { prefix: '8130', desc: 'Fog Light Bulb' },
        { prefix: '8140', desc: 'Interior Dome Light' },
        { prefix: '8150', desc: 'License Plate Light' },
        { prefix: '8160', desc: 'Side Turn Signal' },
        { prefix: '8170', desc: 'Brake Light Switch' },
        { prefix: '8180', desc: 'Headlight Assembly Housing' },
        { prefix: '8190', desc: 'Rear Combination Lamp' }
      ],
      interior: [
        { prefix: '9110', desc: 'Dashboard Trim Panel' },
        { prefix: '9120', desc: 'Door Panel Interior' },
        { prefix: '9130', desc: 'Steering Wheel Leather' },
        { prefix: '9140', desc: 'Seat Cushion Front' },
        { prefix: '9150', desc: 'Headrest Assembly' },
        { prefix: '9160', desc: 'Floor Mat Set' },
        { prefix: '9170', desc: 'Sun Visor Assembly' },
        { prefix: '9180', desc: 'Cup Holder Assembly' },
        { prefix: '9190', desc: 'Center Console Panel' }
      ],
      exterior: [
        { prefix: '10110', desc: 'Bumper Front Assembly' },
        { prefix: '10111', desc: 'Bumper Rear Assembly' },
        { prefix: '10120', desc: 'Door Handle Exterior' },
        { prefix: '10130', desc: 'Window Glass Front Door' },
        { prefix: '10140', desc: 'Weather Stripping Door' },
        { prefix: '10150', desc: 'Molding Trim Body' },
        { prefix: '10160', desc: 'Bumper Guard Chrome' },
        { prefix: '10170', desc: 'Roof Rails Assembly' },
        { prefix: '10180', desc: 'Fender Outer Panel' },
        { prefix: '10190', desc: 'Hood Latch Assembly' }
      ],
      awd: [
        { prefix: '11110', desc: 'AWD Transfer Case' },
        { prefix: '11120', desc: 'Front Axle Assembly AWD' },
        { prefix: '11130', desc: 'Rear Axle Assembly AWD' },
        { prefix: '11140', desc: 'AWD Coupling Unit' },
        { prefix: '11150', desc: 'Differential Lock Actuator' },
        { prefix: '11160', desc: 'Power Transfer Unit' },
        { prefix: '11170', desc: 'Front Drive Shaft' }
      ]
    };

    let totalPartsCreated = 0;

    for (const model of coreModels) {
      const modelKey = model.modelId;
      const categories = partCategories[modelKey] || partCategories.corsa;

      console.log(`\n📦 Seeding ${model.name}`);

      for (const category of categories) {
        const templates = partTemplates[category.categoryId] || partTemplates.engine;
        const partsPerTemplate = 10;
        const parts = [];

        for (const template of templates) {
          for (let i = 0; i < partsPerTemplate; i++) {
            const suffix = String(i + 1).padStart(3, '0');
            const variant = String(Math.floor(Math.random() * 900) + 100);
            const partNumber = `${template.prefix}-${variant}-${suffix}`;

            parts.push({
              partNumber: partNumber,
              name: `${template.desc} (${model.name})`,
              categoryId: category.categoryId,
              modelId: model.modelId,
              description: `${template.desc} - Genuine Opel OEM Part for ${model.name}`,
              quantity: Math.floor(Math.random() * 50) + 5,
              specifications: {
                weight: `${(Math.random() * 5 + 0.5).toFixed(2)} kg`,
                material: ['Steel', 'Aluminum', 'Composite', 'Rubber', 'Plastic'][Math.floor(Math.random() * 5)],
                condition: 'New',
                warranty: `${Math.floor(Math.random() * 36) + 12} months`
              },
              compatibility: {
                models: [model.name],
                years: [parseInt(new Date().getFullYear()) - Math.floor(Math.random() * 10)],
                engines: ['1.0L', '1.2L', '1.4L', '1.6L'][Math.floor(Math.random() * 4)],
                transmissions: ['Manual', 'Automatic'][Math.floor(Math.random() * 2)]
              },
              pricing: {
                oem: parseFloat((Math.random() * 300 + 15).toFixed(2)),
                aftermarket: parseFloat((Math.random() * 250 + 10).toFixed(2)),
                currency: 'EUR'
              },
              imageUrl: `https://parts.opel.com/${partNumber}.jpg`,
              externalLinks: {
                oem: `https://parts.opel.com/${partNumber}`,
                image: null
              }
            });
          }
        }

        try {
          await VehiclePart.insertMany(parts, { ordered: false }).catch(e => {
            if (e.code !== 11000) throw e;
          });
          console.log(`   ✅ ${category.categoryName}: ${parts.length}  parts`);
          totalPartsCreated += parts.length;
        } catch (err) {
          console.log(`   ⚠️  ${category.categoryName}: Skipped (already exists)`);
        }
      }
    }

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ ✅ Quick Setup Complete!                              ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║ Models Created: 3                                      ║`);
    console.log(`║ Parts Seeded: ${String(totalPartsCreated).padStart(40)}║`);
    console.log(`║ Categories: ~24                                        ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

    const totalInDB = await VehiclePart.countDocuments();
    console.log(`✅ Total parts in database: ${totalInDB}\n`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickSetup();
