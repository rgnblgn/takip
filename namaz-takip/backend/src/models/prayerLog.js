const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    sabah: { type: Number, default: 0 },
    ogle: { type: Number, default: 0 },
    ikindi: { type: Number, default: 0 },
    aksam: { type: Number, default: 0 },
    yatsi: { type: Number, default: 0 },
    note: { type: String },
}, { timestamps: true });

schema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PrayerLog', schema);
