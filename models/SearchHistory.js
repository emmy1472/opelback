const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vin: {
        type: String,
        required: true,
        uppercase: true,
        length: 17
    },
    modelName: {
        type: String,
        default: ''
    },
    searchedAt: {
        type: Date,
        default: Date.now
    }
});

searchHistorySchema.index({ userId: 1, searchedAt: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
