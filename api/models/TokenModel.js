const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    serviceContractAddress: {
        type: String,
        required: true,
        unique: true
    },
    tokenContractAddress: {
        type: String,
        required: true
    },
    liquidityContractAddress: {
        type: String,
        required: true
    },
    revenueDistributionContractAddress: {
        type: String,
        required: true
    },
    revenueStreamContractAddresses: [{
        type: String
    }],
    assetDIDs: [{
        type: String,
        unique: true
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
