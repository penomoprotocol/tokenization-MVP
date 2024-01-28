const mongoose = require('mongoose');

const statusUpdateSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    messages: [{
        type: String
    }],
    actionsNeeded: [{
        type: String
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

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
    assetValue: {
        type: Number,
    },
    revenueStreams: [{
        name: String,
        amount: Number,
        details: String
    }],
    fundingGoal: {
        type: Number,
    },
    fundingCurrent: {
        type: Number,
    },
    fundingUsage: [{
        amount: Number,
        description: String
    }],
    projectDescription: {
        type: String,
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
    tokenContractBalance: {
        type: Number
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
    assetIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    statusUpdates: [statusUpdateSchema] 
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
