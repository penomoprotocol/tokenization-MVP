const mongoose = require('mongoose');

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
    bank: {
        type: String,
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
