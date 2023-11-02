const mongoose = require('mongoose');

// Define investor schema
const investorSchema = new mongoose.Schema({
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
    },
    ethereumPublicKey: {
        type: String,
    },
});

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;
