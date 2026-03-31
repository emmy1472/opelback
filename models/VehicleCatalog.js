const mongoose = require('mongoose');

const vehicleCatalogSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    url: { type: String, required: true, unique: true, index: true },
    parentUrl: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
});

// Compound index for faster lookups
vehicleCatalogSchema.index({ parentUrl: 1, name: 1 });

module.exports = mongoose.model('VehicleCatalog', vehicleCatalogSchema);
