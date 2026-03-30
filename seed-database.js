#!/usr/bin/env node
/**
 * SEED DATABASE - Simple version with known models
 * Run once: node seed-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleModel = require('./models/VehicleModel');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Error:', err.message);
        process.exit(1);
    });

async function seedModels() {
    try {
        const models = [
            { name: 'Opel Adam', url: 'https://opel.7zap.com/en/global/adam-m13-parts-catalog/' },
            { name: 'Opel Astra K', url: 'https://opel.7zap.com/en/global/astra-k-parts-catalog/' },
            { name: 'Opel Astra J', url: 'https://opel.7zap.com/en/global/astra-j-parts-catalog/' },
            { name: 'Opel Astra H', url: 'https://opel.7zap.com/en/global/astra-h-parts-catalog/' },
            { name: 'Opel Astra G', url: 'https://opel.7zap.com/en/global/astra-g-parts-catalog/' },
            { name: 'Opel Corsa E', url: 'https://opel.7zap.com/en/global/corsa-e-parts-catalog/' },
            { name: 'Opel Corsa D', url: 'https://opel.7zap.com/en/global/corsa-d-parts-catalog/' },
            { name: 'Opel Corsa C', url: 'https://opel.7zap.com/en/global/corsa-c-parts-catalog/' },
            { name: 'Opel Corsa B', url: 'https://opel.7zap.com/en/global/corsa-b-parts-catalog/' },
            { name: 'Opel Vectra C', url: 'https://opel.7zap.com/en/global/vectra-c-parts-catalog/' },
            { name: 'Opel Vectra B', url: 'https://opel.7zap.com/en/global/vectra-b-parts-catalog/' },
            { name: 'Opel Vectra A', url: 'https://opel.7zap.com/en/global/vectra-a-parts-catalog/' },
            { name: 'Opel Zafira C', url: 'https://opel.7zap.com/en/global/zafira-c-parts-catalog/' },
            { name: 'Opel Zafira B', url: 'https://opel.7zap.com/en/global/zafira-b-parts-catalog/' },
            { name: 'Opel Zafira A', url: 'https://opel.7zap.com/en/global/zafira-a-parts-catalog/' },
            { name: 'Opel Insignia B', url: 'https://opel.7zap.com/en/global/insignia-b-parts-catalog/' },
            { name: 'Opel Insignia A', url: 'https://opel.7zap.com/en/global/insignia-a-parts-catalog/' },
            { name: 'Opel Meriva', url: 'https://opel.7zap.com/en/global/meriva-parts-catalog/' },
            { name: 'Opel Combo', url: 'https://opel.7zap.com/en/global/combo-parts-catalog/' },
            { name: 'Opel Vivaro', url: 'https://opel.7zap.com/en/global/vivaro-parts-catalog/' },
        ];

        console.log('\n💾 Seeding models...');
        let count = 0;
        
        for (const model of models) {
            await VehicleModel.findOneAndUpdate(
                { name: model.name },
                model,
                { upsert: true, new: true }
            );
            count++;
            process.stdout.write(`\r   ✓ ${count}/${models.length} models saved`);
        }

        const totalModels = await VehicleModel.countDocuments();
        console.log(`\n\n✅ Database seeded successfully!`);
        console.log(`   Total models in database: ${totalModels}\n`);
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

seedModels();
