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

// Initialized app
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Define company schema and model
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
});
const Company = mongoose.model('Company', companySchema);

const investorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // ... 
});
const Investor = mongoose.model('Investor', investorSchema);

// Import database models -> DEBUG IMPORT / TIMEOUT ERROR!
// const Company = require('../database/models/Company');
// const Investor = require('../database/models/Investor');
// const Asset = require('../database/models/Asset');
// const Transaction = require('../database/models/Transaction');



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

// app.get('/protectedRoute', passport.authenticate('jwt', { session: false }), (req, res) => {
//     res.send('This is a protected route!');
// });

// // Company Routes

// Company Registration
app.post('/company/register', async (req, res) => {
    try {
        console.log('Received registration request:', req.body); // Add this line for debugging
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const company = new Company({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await company.save();
        console.log('Company registered successfully:', company); // Add this line for debugging
        //res.status(200).send('Company registered successfully');
        res.json({ company });
    } catch (error) {
        console.error('Error while registering company:', error);
        res.status(500).send('Error registering company');
    }
});


// Company Login
app.post('/company/login', async (req, res) => {
    try {
        const company = await Company.findOne({ email: req.body.email });
        if (!company) {
            console.log('Company not found:', req.body.email); // Add this line for debugging
            return res.status(401).send('Company not found');
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, company.password);
        if (isPasswordValid) {
            console.log('Login successful:', company.email); // Add this line for debugging
            const token = jwt.sign({ id: company._id }, JWT_SECRET_KEY);
            res.json({ token });
        } else {
            console.log('Invalid credentials:', req.body.email); // Add this line for debugging
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Error logging in');
    }
});


// Retrieve company details by ID
app.get('/company/:id', async (req, res) => {
    try {
        const companyId = req.body._id;
        console.log('Retrieving company details for ID:', companyId); // Add this line for debugging
        const company = await Company.findById(companyId);
        if (!company) {
            console.log('Company not found:', companyId); // Add this line for debugging
            return res.status(404).send('Company not found');
        }
        console.log('Company details retrieved:', company); // Add this line for debugging
        res.json(company);
    } catch (error) {
        console.error('Error retrieving company:', error);
        res.status(500).send('Error retrieving company');
    }
});


// Update company details by ID
app.put('/company/:id', async (req, res) => {
    try {
        const companyId = req.body._id;
        const updates = req.body;
        const updatedCompany = await Company.findByIdAndUpdate(companyId, updates, { new: true });
        if (!updatedCompany) {
            return res.status(404).send('Company not found');
        }
        res.json(updatedCompany);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).send('Error updating company');
    }
});

// Delete company by ID
app.delete('/company/:id', async (req, res) => {
    try {
        const companyId = req.body._id;
        const deletedCompany = await Company.findByIdAndRemove(companyId);
        if (!deletedCompany) {
            return res.status(404).send('Company not found');
        }
        res.json(deletedCompany);
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).send('Error deleting company');
    }
});



// // Investor Routes

// // Investor Registration
app.post('/investor/register', async (req, res) => {
    try {
        console.log('Received registration request:', req.body); // Add this line for debugging
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const investor = new Investor({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await investor.save();
        console.log('Company registered successfully:', investor); // Add this line for debugging
        //res.status(200).send('Company registered successfully');
        res.json({ investor });
    } catch (error) {
        console.error('Error while registering investor:', error);
        res.status(500).send('Error registering investor');
    }
});
//Investor Login
app.post('/investor/login', async (req, res) => {
    try {
        const investor = await Investor.findOne({ email: req.body.email });
        if (!investor) {
            return res.status(401).send('Investor not found');
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, investor.password);
        if (isPasswordValid) {
            const token = jwt.sign({ id: investor._id }, JWT_SECRET_KEY);
            res.json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

app.post('/investor/buyToken', (req, res) => {
    // Handle token purchase
});

// Retrieve investor details by ID
app.get('/investor/:id', async (req, res) => {
    try {
        const investorId = req.body._id;
        console.log('Retrieving investor details for ID:', investorId); // Add this line for debugging
        const investor = await Investor.findById(investorId);
        if (!investor) {
            console.log('Investor not found:', investorId); // Add this line for debugging
            return res.status(404).send('Investor not found');
        }
        console.log('Investor details retrieved:', investor); // Add this line for debugging
        res.json(investor);
    } catch (error) {
        console.error('Error retrieving investor:', error);
        res.status(500).send('Error retrieving investor');
    }
});


// Update investor details by ID
app.put('/investor/:id', async (req, res) => {
    try {
        const investorId = req.body._id;
        const updates = req.body;
        const updatedInvestor = await Investor.findByIdAndUpdate(investorId, updates, { new: true });
        if (!updatedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(updatedInvestor);
    } catch (error) {
        console.error('Error updating investor:', error);
        res.status(500).send('Error updating investor');
    }
});

// Delete investor by ID
app.delete('/investor/:id', async (req, res) => {
    try {
        const investorId = req.body._id;
        const deletedInvestor = await Investor.findByIdAndRemove(investorId);
        if (!deletedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(deletedInvestor);
    } catch (error) {
        console.error('Error deleting investor:', error);
        res.status(500).send('Error deleting investor');
    }
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
