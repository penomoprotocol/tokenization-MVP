const mongoose = require('mongoose');

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
    registeredDate: {
        type: Date,
        default: Date.now
    }
    // ... any other fields you might need
});

const Company = mongoose.model('Company', companySchema);
