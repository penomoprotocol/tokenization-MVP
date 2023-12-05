const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    maxTokenSupply:{
        type: Number,
        required: true,
    },
    tokenPrice:{
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        enum: ['ETH', 'USDC'] // Accepts only 'ETH' or 'USDC'
    },
    revenueShare:{
        type: Number,
        required: true,
    },
    contractTerm:{
        type: Number,
        required: true,
    },
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
