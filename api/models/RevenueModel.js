const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['rental', 'grid', 'data', 'carbon'], // Allowed types of revenue
    },
    serviceContractAddress: {
        type: String,
        required: true,
        unique: true,
    },
    revenueStreamContractAddress: {
        type: String,
        required: true,
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
        enum: ['minute', 'kWh', 'tCO2', 'kilobyte', 'other'], // Define allowed units
    },
    currency: {
        type: String,
        required: true,
        default: 'USDC', // Default to USDC, but can be set to any currency/token
    },
    assetDID: {
        type: String,
        required: true,
        ref: 'Asset', // Reference to the Asset model
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Reference to the Company model
        required: true,
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
revenueSchema.index({ serviceContractAddress: 1 });
revenueSchema.index({ assetDID: 1 });
revenueSchema.index({ companyId: 1 });

// Optional: Add pre-save middleware to handle updatedAt field
revenueSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Revenue = mongoose.model('Revenue', revenueSchema);

module.exports = Revenue;
