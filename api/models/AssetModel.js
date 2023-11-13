const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    DID: {
        type: String,
        required: true,
        unique: true
    },
    CID: {
        type: String
    },
    revenueStreamContracts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RevenueStreamContract'
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;