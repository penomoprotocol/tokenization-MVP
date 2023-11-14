const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionType: {
        type: String,
        required: true,
        enum: ['token_transaction', 'revenue_generation', 'revenue_distribution'], // Define the allowed transaction types
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USDC', // Default to USDC, but can be set to any currency/token
    },
    fromAddress: {
        type: String,
        required: function() { return this.transactionType !== 'revenue_generation'; }, // Not required for revenue generation transactions
    },
    toAddress: {
        type: String,
        required: function() { return this.transactionType !== 'revenue_generation'; }, // Not required for revenue generation transactions
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true,
    },
    assetDID: {
        type: String,
        ref: 'Asset', // Reference to the Asset model for transactions related to a specific asset
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Reference to the Company model for company-specific transactions
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'failed'], // Track the status of the transaction
        default: 'pending',
    },
    details: {
        type: Map,
        of: String, // Flexible field to store additional data specific to the transaction type
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Optional: Add indexes for faster query performance
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ transactionHash: 1 });
transactionSchema.index({ assetDID: 1 });
transactionSchema.index({ companyId: 1 });

// Optional: Add pre-save middleware to handle updatedAt field
transactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
