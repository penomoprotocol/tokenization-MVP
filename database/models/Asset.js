const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    DID: {
        type: String,
        required: true,
        unique: true
    },
    CID: String,
    batteryData: {
        type: Object,
        required: true
    },
    tokenized: {
        type: Boolean,
        default: false
    },
    // ...
});

const Asset = mongoose.model('Asset', assetSchema);
