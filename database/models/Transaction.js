const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['buy', 'sell', 'revenue-distribution'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // or 'Investor' or 'Company' depending on setup
        required: true
    }
    // ... 
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; // Export the Transaction model