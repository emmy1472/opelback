const mongoose = require('mongoose');

const vehicleModelSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    url: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('VehicleModel', vehicleModelSchema);
