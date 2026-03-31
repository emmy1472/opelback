const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    vin: {
        type: String,
        required: true,
        uppercase: true,
        length: 17,
        index: true
    },
    modelName: {
        type: String,
        default: ''
    },
    searchedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound indices for common queries
searchHistorySchema.index({ userId: 1, searchedAt: -1 });
searchHistorySchema.index({ vin: 1, userId: 1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
