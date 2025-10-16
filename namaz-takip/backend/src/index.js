require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');

const User = require('./models/user');
const PrayerLog = require('./models/prayerLog');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/namaz-takip';
mongoose.connect(MONGO).then(() => console.log('Mongo connected')).catch(e => console.error(e));

function makeToken() {
    return crypto.randomBytes(24).toString('hex');
}

async function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ message: 'no auth header' });
    const parts = auth.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];
    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(401).json({ message: 'invalid token' });
        req.user = user;
        next();
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
}

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'user exists' });
        const token = makeToken();
        const user = new User({ email, password, token });
        await user.save();
        return res.json({ ok: true, token });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'invalid credentials' });
        const ok = await user.comparePassword(password);
        if (!ok) return res.status(401).json({ message: 'invalid credentials' });
        const token = makeToken();
        user.token = token;
        await user.save();
        return res.json({ ok: true, token });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        return res.json({ ok: true, profile: { mukellefSince: user.mukellefSince || null, startedPrayerAt: user.startedPrayerAt || null, kazaTotals: user.kazaTotals || { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 } } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { mukellefSince, startedPrayerAt } = req.body;
        const user = req.user;
        if (mukellefSince !== undefined) user.mukellefSince = mukellefSince;
        if (startedPrayerAt !== undefined) user.startedPrayerAt = startedPrayerAt;
        await user.save();
        return res.json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

// Record kaza counts (increments aggregated totals)
app.post('/api/kaza', authMiddleware, async (req, res) => {
    try {
        const { sabah = 0, ogle = 0, ikindi = 0, aksam = 0, yatsi = 0, note } = req.body;
        const user = req.user;
        user.kazaTotals = user.kazaTotals || { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 };
        user.kazaTotals.sabah = (user.kazaTotals.sabah || 0) + Number(sabah);
        user.kazaTotals.ogle = (user.kazaTotals.ogle || 0) + Number(ogle);
        user.kazaTotals.ikindi = (user.kazaTotals.ikindi || 0) + Number(ikindi);
        user.kazaTotals.aksam = (user.kazaTotals.aksam || 0) + Number(aksam);
        user.kazaTotals.yatsi = (user.kazaTotals.yatsi || 0) + Number(yatsi);
        await user.save();
        // also upsert a PrayerLog for the date (default today)
        const date = req.body.date || (new Date()).toISOString().slice(0, 10);
        const update = { $inc: { sabah: Number(sabah), ogle: Number(ogle), ikindi: Number(ikindi), aksam: Number(aksam), yatsi: Number(yatsi) } };
        if (note) update.$set = { note };
        const log = await PrayerLog.findOneAndUpdate({ user: user._id, date }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
        return res.json({ ok: true, kazaTotals: user.kazaTotals, log });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

// GET prayer logs for a date range (inclusive)
app.get('/api/prayer-logs', authMiddleware, async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ message: 'start and end query params required' });
        const logs = await PrayerLog.find({ user: req.user._id, date: { $gte: String(start), $lte: String(end) } }).lean();
        return res.json({ ok: true, logs });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

// Upsert a prayer log for a specific date (set exact counts / flags)
app.post('/api/prayer-log', authMiddleware, async (req, res) => {
    try {
        const { date, sabah = 0, ogle = 0, ikindi = 0, aksam = 0, yatsi = 0, vitr = 0, note } = req.body;
        if (!date) return res.status(400).json({ message: 'date is required (YYYY-MM-DD)' });
        const user = req.user;
        const update = {
            $set: {
                sabah: Number(sabah),
                ogle: Number(ogle),
                ikindi: Number(ikindi),
                aksam: Number(aksam),
                yatsi: Number(yatsi),
                vitr: Number(vitr || 0),
            }
        };
        if (note) update.$set.note = note;
        const log = await PrayerLog.findOneAndUpdate({ user: user._id, date }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
        return res.json({ ok: true, log });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server listening on', port));
