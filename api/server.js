require('dotenv').config();

// Swagger Configuration
const swaggerJsdoc = require('swagger-jsdoc');
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'penomo Protocol API',
            version: '1.0.0',
        },
        tags: [
            {
                name: 'Investor',
                description: 'Endpoints related to investor interactions'
            },
            {
                name: 'Company',
                description: 'Endpoints related to company interactions'
            },
            {
                name: 'Asset',
                description: 'Endpoints related to asset registration and data storage'
            },
            {
                name: 'Token',
                description: 'Endpoints related to tokenization contracts'
            },
            {
                name: 'Revenue',
                description: 'Endpoints related to asset revenue streams'
            },
            {
                name: 'Transaction',
                description: 'Endpoints related to transaction data and billing'
            },
        ]
    },
    apis: ['./routes/*.js'],
}
const openapiSpecification = swaggerJsdoc(options);

// Imports
const express = require('express');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('./config/web3Config');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const swaggerUi = require('swagger-ui-express');

// Load environment variables
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
console.log(SECRET_KEY);
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

// Initiate express
const app = express();
app.use(express.json());

// Enable CORS for all routes
const cors = require('cors');
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// JWT configuration
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: SECRET_KEY
};

// Initialize passport
passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
}));
app.use(passport.initialize());

// Import and use routes
const investorRoutes = require('./routes/investor');
const companyRoutes = require('./routes/company');
const assetRoutes = require('./routes/asset');
const tokenRoutes = require('./routes/token');
const revenueRoutes = require('./routes/revenue');
const transactionRoutes = require('./routes/transaction');

// API routes
app.use('/api', investorRoutes);
app.use('/api', companyRoutes);
app.use('/api', assetRoutes);
app.use('/api', tokenRoutes);
app.use('/api', revenueRoutes);
app.use('/api', transactionRoutes);

// Serve Swagger UI on a specific path
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Optional: Catch-all route to handle undefined routes, after all other routes
app.use('*', (req, res) => {
  res.status(404).send('API endpoint does not exist');
});


// Start the server
app.listen(PORT, (err) => {
    if (err) {
        return console.error('Error starting server:', err);
    }
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export modules
module.exports = { app, investorRoutes, companyRoutes, assetRoutes, tokenRoutes, revenueRoutes, transactionRoutes };

