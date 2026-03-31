const mongoose = require('mongoose');

const vehicleModelSchema = new mongoose.Schema({
    modelId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true, index: true },
    url: { type: String, required: true },
    type: { type: String, default: '' },
    baseUrl: { type: String, default: '' },
    yearsSupported: { type: String, default: '' },
    partsCatalogSize: { type: Number, default: 0 },
    lastScrapedAt: { type: Date, default: null },
    image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('VehicleModel', vehicleModelSchema);
