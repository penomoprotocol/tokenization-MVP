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
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

const app = express();
app.use(express.json()); // Use JSON middleware


const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: SECRET_KEY
};

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Initialize passport
passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
}));
app.use(passport.initialize());

// Swagger Configuration
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express API with Swagger',
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
    apis: ['./routes/*.js'], // files containing annotations
}


const openapiSpecification = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Add a root route
app.get('/', (req, res) => {
    res.send('Welcome to the API. Visit /api-docs for documentation.');
});

// Import and use routes
const companyRoutes = require('./routes/company');
const investorRoutes = require('./routes/investor');
const assetRoutes = require('./routes/asset');
const transactionRoutes = require('./routes/transaction');

app.use(companyRoutes);
app.use(investorRoutes);
app.use(assetRoutes);
app.use(transactionRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Export modules
module.exports = { app, companyRoutes, investorRoutes, assetRoutes};
