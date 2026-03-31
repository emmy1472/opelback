const mongoose = require('mongoose');

const vehiclePartSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    number: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true, index: true },
    parentUrl: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
});

// Compound index for faster lookups
vehiclePartSchema.index({ parentUrl: 1, number: 1 });

module.exports = mongoose.model('VehiclePart', vehiclePartSchema);
