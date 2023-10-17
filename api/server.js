const express = require('express');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Get variables from .env
const PORT = process.env.PORT || 3000;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Import database models
const Company = require('../database/models/Company');
const Investor = require('../database/models/Investor');
const Asset = require('../database/models/Asset');
const Transaction = require('../database/models/Transaction');


const app = express();

app.use(express.json());

// Connect to MongoDB
//mongoose.connect(uri, { useNewUrlParser: true });
mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// User schema and model
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model('User', userSchema);

// JWT configuration
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET_KEY
};

// Initialize passport
passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
}));
app.use(passport.initialize());


// Listen to server port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// // // Routes

// // Company Routes
app.get('/protectedRoute', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send('This is a protected route!');
});

// Company Registration
app.post('/company/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const company = new Company({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await company.save();
        const token = jwt.sign({ id: company._id }, JWT_SECRET_KEY);
        res.json({ token });
    } catch (error) {
        res.status(500).send('Error registering company');
    }
});

// Company Login
// app.post('/company/login', async (req, res) => {
//     try {
//         const company = await Company.findOne({ email: req.body.email });
//         if (!company) {
//             return res.status(401).send('Company not found');
//         }
//         const isPasswordValid = await bcrypt.compare(req.body.password, company.password);
//         if (isPasswordValid) {
//             const token = jwt.sign({ id: company._id }, JWT_SECRET_KEY);
//             res.json({ token });
//         } else {
//             res.status(401).send('Invalid credentials');
//         }
//     } catch (error) {
//         res.status(500).send('Error logging in');
//     }
// });



app.get('/company/:id', (req, res) => {
    // Retrieve company details
});

app.put('/company/:id', (req, res) => {
    // Update company details
});

app.delete('/company/:id', (req, res) => {
    // Delete company
});


// // Investor Routes

// // Investor Registration
// app.post('/investor/register', async (req, res) => {
//     try {
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);
//         const investor = new Investor({
//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword
//         });
//         await investor.save();
//         const token = jwt.sign({ id: investor._id }, JWT_SECRET_KEY);
//         res.json({ token });
//     } catch (error) {
//         res.status(500).send('Error registering investor');
//     }
// });

// Investor Login
// app.post('/investor/login', async (req, res) => {
//     try {
//         const investor = await Investor.findOne({ email: req.body.email });
//         if (!investor) {
//             return res.status(401).send('Investor not found');
//         }
//         const isPasswordValid = await bcrypt.compare(req.body.password, investor.password);
//         if (isPasswordValid) {
//             const token = jwt.sign({ id: investor._id }, JWT_SECRET_KEY);
//             res.json({ token });
//         } else {
//             res.status(401).send('Invalid credentials');
//         }
//     } catch (error) {
//         res.status(500).send('Error logging in');
//     }
// });

app.post('/investor/buyToken', (req, res) => {
    // Handle token purchase
});

app.get('/investor/:id', (req, res) => {
    // Retrieve investor details
});

app.put('/investor/:id', (req, res) => {
    // Update investor details
});

app.delete('/investor/:id', (req, res) => {
    // Delete investor
});


// // Asset Routes

// Real World Assets Routes
app.post('/asset/register', (req, res) => {
    // Register asset and return DID
});

app.post('/asset/storeData', (req, res) => {
    // Store asset data and return CID
});

app.post('/asset/tokenize', (req, res) => {
    // Tokenize asset and deploy contracts
});

app.post('/asset/connectRevenueStream', (req, res) => {
    // Deploy revenue stream contract and connect to tokenization engine
});

app.get('/asset/:did', (req, res) => {
    // Retrieve asset details
});

app.put('/asset/:did', (req, res) => {
    // Update asset details
});

app.delete('/asset/:id', (req, res) => {
    // Delete asset
});


// // Transactions Routes

app.post('/transactions', (req, res) => {
    // Log a new transaction
});

app.get('/transactions', (req, res) => {
    // Retrieve all transactions
});

app.get('/transactions/:id', (req, res) => {
    // Retrieve specific transaction
});

app.get('/transactions/user/:userId', (req, res) => {
    // Retrieve all transactions for a specific user
});

module.exports = app;
