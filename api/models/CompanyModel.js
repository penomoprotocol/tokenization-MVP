const mongoose = require('mongoose');
const validator = require('validator'); // Add this to use the validator library

// Define company schema
const companySchema = new mongoose.Schema({
    surname: {
        type: String,
    },    
    firstname: {
        type: String,
    },
    dob: Date,
    businessName: {
        type: String,
        required: true
    },
    ticker: {
        type: String,
    },
    registrationNumber: {
        type: String,
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
        unique: true,
        validate: [validator.isEmail, 'Invalid email']
    },
    bank: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    ethereumPrivateKey: {
        type: String,
    },
    ethereumPublicKey: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isKycVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    }
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
