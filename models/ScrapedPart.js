/**
 * ScrapedParts Model
 * Stores hierarchical parts data from scraping
 * Structure: Model → Category → Sub-Category → Parts
 */
const mongoose = require('mongoose');

const scrapedPartSchema = new mongoose.Schema({
    // Hierarchy
    modelName: { 
        type: String, 
        required: true, 
        index: true 
    },
    categoryName: { 
        type: String, 
        required: true, 
        index: true 
    },
    subCategoryName: { 
        type: String, 
        required: true, 
        index: true 
    },

    // Part Data
    partName: { 
        type: String, 
        required: true, 
        index: true 
    },
    oemNumber: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    imageUrl: { 
        type: String, 
        default: null 
    },

    // URLs for reference
    modelUrl: String,
    categoryUrl: String,
    subCategoryUrl: String,

    // Metadata
    scrapedAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Compound indexes for common queries
scrapedPartSchema.index({ modelName: 1, categoryName: 1 });
scrapedPartSchema.index({ modelName: 1, categoryName: 1, subCategoryName: 1 });
scrapedPartSchema.index({ oemNumber: 1, modelName: 1 });
scrapedPartSchema.index({ partName: 1, modelName: 1 });

// Full-text search index for part names and descriptions
scrapedPartSchema.index({ partName: 'text', description: 'text' });

module.exports = mongoose.model('ScrapedPart', scrapedPartSchema);
