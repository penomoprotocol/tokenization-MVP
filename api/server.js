//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const {web3, networkId, gasPrice} = require('./config/web3Config');
const { GCABI, GCAddress } = require('./config/GlobalStateContract');

console.log("GCABI:", GCABI);
console.log("GCAddress:", GCAddress);
console.log("web3:", web3);


const express = require('express');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();


// // // INITIALIZE

// Get variables from .env
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;


// Initialize app
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
    ethereumPrivateKey: {
        type: String, // Store the encrypted private key as a string
    },
    ethereumPublicKey: {
        type: String, 
    },
});

const Company = mongoose.model('Company', companySchema);


// Define investor schema and model
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
    ethereumPrivateKey: {
        type: String, // Store the encrypted private key as a string
    },
    ethereumPublicKey: {
        type: String, 
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
    secretOrKey: SECRET_KEY
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

// // // FUNCTIONS

// Function to create a new Ethereum wallet and return the private key
const createWallet = () => {
    const wallet = web3.eth.accounts.create();
    console.log("privateKey: ", wallet.privateKey);
    return wallet;
};

// Function to encrypt and decrypt private keys
const encryptPrivateKey = (privateKey, SECRET_KEY) => {
    const encrypted = CryptoJS.AES.encrypt(privateKey, SECRET_KEY).toString();
    return encrypted;
};

const decryptPrivateKey = (encryptedKey, SECRET_KEY) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
};




// // // ROUTES

// app.get('/protectedRoute', passport.authenticate('jwt', { session: false }), (req, res) => {
//     res.send('This is a protected route!');
// });

// // Company Routes

// Company Registration
app.post('/company/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the user's password
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        const company = new Company({
            name,
            email,
            password: hashedPassword,
            ethereumPrivateKey: encryptedPrivateKey, // Store the encrypted private key
            ethereumPublicKey: publicKey, // Store the public key (wallet address)
        });

        await company.save();
        console.log("Added company instance: ", company);
        res.status(200).json({ company });
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
            const token = jwt.sign({ id: company._id }, SECRET_KEY);
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

// Company KYC
app.post('/company/verify', async (req, res) => {
    try {
        const { companyWalletAddress } = req.body;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GCABI, GCAddress);
        //console.log("contract: ", contract);

        // Prepare the transaction data
        const data = contract.methods.verifyCompany(companyWalletAddress).encodeABI();
        //console.log("data: ", data);

        // Fetch the nonce for the sender's address
        const senderAddress = MASTER_ADDRESS; // Replace with the sender's Ethereum address
        const nonce = await web3.eth.getTransactionCount(senderAddress);

        // Prepare the transaction object
        //const gasPrice = gasPrice; // Example gas price
        const gasLimit = 200000; // Adjust the gas limit as needed
        const rawTransaction = {
            from: MASTER_ADDRESS,
            to: GCAddress,
            gas: gasLimit,
            gasPrice,
            nonce,
            data,
        };

        // Sign the transaction with the private key
        const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction, MASTER_PRIVATE_KEY);
        console.log("signedTransaction: ", signedTransaction);

        // Send the signed transaction to the network
        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({ message: 'Company successfully verified' });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }
    } catch (error) {
        console.error('Error in company registration:', error);
        return res.status(500).json({ error: 'An error occurred' });
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

// Investor Registration
app.post('/investor/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the user's password
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        const investor = new Investor({
            name,
            email,
            password: hashedPassword,
            ethereumPrivateKey: encryptedPrivateKey, // Store the encrypted private key
            ethereumPublicKey: publicKey, // Store the public key (wallet address)
        });

        await investor.save();
        console.log("Added investor instance: ", investor);
        res.status(200).json({ investor });
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
            console.log('Investor not found:', req.body.email); // Add this line for debugging
            return res.status(401).send('Investor not found');
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, investor.password);
        if (isPasswordValid) {
            console.log('Login successful:', investor.email); // Add this line for debugging
            const token = jwt.sign({ id: investor._id }, SECRET_KEY);
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


// Investor KYC
app.post('/investor/verify', async (req, res) => {
    try {
        const { investorWalletAddress } = req.body;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GCABI, GCAddress);
        //console.log("contract: ", contract);

        // Prepare the transaction data
        const data = contract.methods.verifyInvestor(investorWalletAddress).encodeABI();
        //console.log("data: ", data);

        // Fetch the nonce for the sender's address
        const senderAddress = MASTER_ADDRESS; // Replace with the sender's Ethereum address
        const nonce = await web3.eth.getTransactionCount(senderAddress);

        // Prepare the transaction object
        //const gasPrice = gasPrice; // Example gas price
        const gasLimit = 200000; // Adjust the gas limit as needed
        const rawTransaction = {
            from: MASTER_ADDRESS,
            to: GCAddress,
            gas: gasLimit,
            gasPrice,
            nonce,
            data,
        };

        // Sign the transaction with the private key
        const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction, MASTER_PRIVATE_KEY);
        console.log("signedTransaction: ", signedTransaction);

        // Send the signed transaction to the network
        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({ message: 'Investor successfully verified' });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }
    } catch (error) {
        console.error('Error in investor registration:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});





// Handle investor token purchase
app.post('/investor/buyToken', (req, res) => {
    
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



// // Transactions Routes (Nice to have for book keeping & analytics)

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


// // // EXPORT
module.exports = {app, Company, Investor};
