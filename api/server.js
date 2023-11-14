const swaggerJsdoc = require('swagger-jsdoc');
// Swagger Configuration
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'penomo Protocol API',
            version: '1.0.0',
        },
        tags: [
            {
                name: 'Company',
                description: 'Endpoints related to companies'
            },
            {
                name: 'Investor',
                description: 'Endpoints related to investors'
            },
            {
                name: 'Asset',
                description: 'Endpoints related to assets'
            },
            {
                name: 'Transaction',
                description: 'Endpoints related to transactions'
            },
        ]
    },
    apis: ['./routes/*.js'],
}
const openapiSpecification = swaggerJsdoc(options);

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
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

const app = express();
app.use(express.json());

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
const companyRoutes = require('./routes/company');
const investorRoutes = require('./routes/investor');
const assetRoutes = require('./routes/asset');
const tokenRoutes = require('./routes/token');
const revenueRoutes = require('./routes/revenue');
const transactionRoutes = require('./routes/transaction');

// API routes
app.use('/api', companyRoutes);
app.use('/api', investorRoutes);
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
module.exports = { app, companyRoutes, investorRoutes, assetRoutes, tokenRoutes,revenueRoutes, transactionRoutes };

