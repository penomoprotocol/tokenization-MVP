const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    
    DID: {
        type: String,
        required: true,
        unique: true
    },
    CID: {
        type: String
    },
    publicKey: {
        type: String
    },
    privateKey: {
        type: String
    },
    revenueStreamContracts: [{
        type: String
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;