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
});

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;
