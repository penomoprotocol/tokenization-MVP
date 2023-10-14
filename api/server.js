const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ipfsClient = require('ipfs-http-client');
const cors = require('cors');

// Authentication and authorization imports
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bbTokenization', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Initialize IPFS client
const ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });


// JWT configuration
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'YOUR_SECRET_KEY'  // Replace with your secret key
};


// Initialize passport
passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    // Here, you'd typically look up your user in the database using the info in jwtPayload
    // For simplicity, we'll just return the jwtPayload as the user
    return done(null, jwtPayload);
}));

app.use(passport.initialize());



// Routes

// Protecting a route using JWT authentication
app.get('/protectedRoute', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send('This is a protected route!');
});

// Company Routes
// Register route with password hashing and token generation
app.post('/company/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Store the hashed password in your database along with other user details
    // ...

    // Return a JWT to the user
    const token = jwt.sign({ id: 'USER_ID' }, 'YOUR_SECRET_KEY');  // Replace USER_ID with the actual user ID from your database
    res.json({ token });
});

// Login route with password verification and token generation
app.post('/company/login', async (req, res) => {
    // Fetch the user from your database using req.body.username or email
    // ...

    const isPasswordValid = await bcrypt.compare(req.body.password, 'STORED_HASHED_PASSWORD');  // Replace STORED_HASHED_PASSWORD with the hashed password from your database

    if (isPasswordValid) {
        const token = jwt.sign({ id: 'USER_ID' }, 'YOUR_SECRET_KEY');  // Replace USER_ID with the actual user ID from your database
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});


app.get('/company/:id', (req, res) => {
    // Retrieve company details
});

app.put('/company/:id', (req, res) => {
    // Update company details
});

app.delete('/company/:id', (req, res) => {
    // Delete company
});

// Investor Routes
app.post('/investor/register', (req, res) => {
    // Handle investor registration
});

app.post('/investor/login', (req, res) => {
    // Handle investor login
});

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

// [Nice to have] Transactions Routes
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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
