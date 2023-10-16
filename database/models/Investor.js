
const mongoose = require('mongoose');

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
    registeredDate: {
        type: Date,
        default: Date.now
    }
    // ... 
});

const Investor = mongoose.model('Investor', investorSchema);
