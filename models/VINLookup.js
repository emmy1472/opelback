const mongoose = require('mongoose');

const vinLookupSchema = new mongoose.Schema({
    vin: { type: String, required: true, unique: true, uppercase: true, index: true },
    model: { type: String, index: true },
    year: { type: Number, index: true },
    engine: String,
    gearbox: String,
    body_style: String,
    market: String,
    catalog_link: String,
    
    // Related data
    model_id: String,  // Link to VehicleModel
    spec_id: String,   // Link to VehicleSpec
    
    // Metadata
    source: { type: String, enum: ['api', 'html_parse', 'vin_structure'], default: 'vin_structure' },
    decoded_at: { type: Date, default: Date.now },
    last_accessed: { type: Date, default: Date.now },
    access_count: { type: Number, default: 1 },
    
    // Full response for debugging
    raw_data: mongoose.Schema.Types.Mixed,
    
    createdAt: { type: Date, default: Date.now, index: true }
});

// Update last accessed time on query
vinLookupSchema.pre('findOne', function() {
    this.set({ last_accessed: new Date() });
});

module.exports = mongoose.model('VINLookup', vinLookupSchema);
