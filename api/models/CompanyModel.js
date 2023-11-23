const mongoose = require('mongoose');

// Define company schema
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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
        unique: true,
    },
    ethereumPublicKey: {
        type: String,
        unique: true
    },
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
