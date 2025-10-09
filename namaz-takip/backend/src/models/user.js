const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String },
    mukellefSince: { type: String },
    startedPrayerAt: { type: String },
}, { timestamps: true });

schema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

schema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', schema);
