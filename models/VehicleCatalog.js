const mongoose = require('mongoose');

const vehicleCatalogSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    parentUrl: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VehicleCatalog', vehicleCatalogSchema);
