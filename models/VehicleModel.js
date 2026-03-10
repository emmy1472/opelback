const mongoose = require('mongoose');

const vehicleModelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VehicleModel', vehicleModelSchema);
