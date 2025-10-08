require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const User = require('./models/user');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/namaz-takip';
mongoose.connect(MONGO).then(() => console.log('Mongo connected')).catch(e => console.error(e));

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'user exists' });
        const user = new User({ email, password });
        await user.save();
        return res.json({ ok: true });
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
        return res.json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'server error' });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server listening on', port));
