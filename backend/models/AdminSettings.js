const mongoose = require('mongoose');

const AdminSettingsSchema = new mongoose.Schema({
    laborRatePerHour: {
        type: Number,
        default: 150
    },
    platformFeePercent: {
        type: Number,
        default: 10
    },
    profitMarginPercent: {
        type: Number,
        default: 20
    }
});

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema);
