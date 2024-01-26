const mongoose = require('mongoose');

// Define investor schema
const investorSchema = new mongoose.Schema({
    surname: {
        type: String,
        required: true
    },    
    firstname: {
        type: String,
        required: true
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
    dob: Date, // Date of birth
    passportId: String,
    passportIssueDate: Date,
    passportExpiryDate: Date,
    isVerified: {
        type: Boolean,
        default: false
    }
});

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;
