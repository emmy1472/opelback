const mongoose = require('mongoose');

const vehicleSpecSchema = new mongoose.Schema({
    year: { type: String, required: true },
    engine: { type: String, required: true },
    transmission: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    parentUrl: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VehicleSpec', vehicleSpecSchema);
