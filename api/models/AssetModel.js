const mongoose = require('mongoose');

// Sub-schema for the DID object
const didSchema = new mongoose.Schema({
    name: {
        type: String
    },
    value: {
        type: String
    },
    validity: {
        type: String
    },
    created: {
        type: String
    },
    document: {
        id: {
            type: String
        },
        controller: {
            type: String
        },
        verificationMethodsList: [{
            // Adjust this based on the structure of objects in the verificationMethodsList
            type: Map,
            of: String
        }],
        signature: {
            type: String
        },
        servicesList: [{
            type: String
        }],
        authenticationsList: [{
            type: String
        }]
    }
});

// Main Asset schema
const assetSchema = new mongoose.Schema({
    assetType: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: true
    },
    capacity: {
        type: String, // consider changing the type based on the data format
    },
    power: {
        type: String, // consider changing the type based on the data format
    },
    location: {
        type: String,
    },
    assetValue: {
        type: Number,
    },
    revenueStreams: [{
        name: String,
        amount: Number,
        details: String
    }],
    financingGoal: {
        type: Number,
    },
    fundUsage: [{
        amount: Number,
        description: String
    }],
    DID: {
        type: didSchema,
        required: true
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
