const mongoose = require('mongoose');

// Define company schema
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        unique: true
    },
    businessAddress: {
        type: String,
    },
    businessPhone: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    ethereumPrivateKey: {
        type: String,
        unique: true
    },
    ethereumPublicKey: {
        type: String,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
