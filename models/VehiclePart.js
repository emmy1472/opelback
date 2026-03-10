const mongoose = require('mongoose');

const vehiclePartSchema = new mongoose.Schema({
    name: { type: String, required: true },
    number: { type: String, required: true },
    url: { type: String, required: true },
    parentUrl: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VehiclePart', vehiclePartSchema);
