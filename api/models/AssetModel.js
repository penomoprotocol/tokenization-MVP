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
    name: {
        type: String,
        required: true
    },
    batteryType: {
        type: String
    },
    capacity: {
        type: String
    },
    voltage: {
        type: String
    },
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
