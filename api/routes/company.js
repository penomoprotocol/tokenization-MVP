//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('../config/web3Config');

const fs = require('fs');
const path = require('path');

const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');


const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();


const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const express = require('express');
const router = express.Router();


const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

const Company = require('../models/CompanyModel');



// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
    return gasPrice;
}


// Helper function to estimate and send the transaction
async function estimateAndSend(transaction, fromAddress, toAddress) {

    // Fetch the current nonce
    let currentNonce = await web3.eth.getTransactionCount(MASTER_ADDRESS, 'pending');

    // Estimate gas for the transaction
    const estimatedGas = await transaction.estimateGas({ from: fromAddress });

    const bufferGas = estimatedGas * 110n / 100n;  // adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    // Prepare the transaction data with nonce
    const txData = {
        from: fromAddress,
        to: toAddress,
        data: transaction.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,
        nonce: currentNonce
    };

    // Increment the nonce for the next transaction
    currentNonce++;

    // Sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(txData, MASTER_PRIVATE_KEY);

    // Send the signed transaction
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

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


/**
 * @swagger
 * /company/register:
 *   post:
 *     summary: Register a company
 *     tags: 
 *     - Company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered company.
 *       500:
 *         description: Error registering company.
 */

// Company Registration
router.post('/company/register', async (req, res) => {
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

/**
 * @swagger
 * /company/login:
 *   post:
 *     summary: Login a company
 *     tags: 
 *     - Company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Company not found or Invalid credentials.
 *       500:
 *         description: Error logging in.
 */

// Company Login
router.post('/company/login', async (req, res) => {
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

/**
 * @swagger
 * /company/verify:
 *   post:
 *     summary: Verify a company's KYC on the blockchain
 *     tags: 
 *     - Company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyWalletAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company successfully verified.
 *       500:
 *         description: An error occurred or transaction failed.
 */

// Company KYC
router.post('/company/verify', async (req, res) => {
    try {
        const { companyWalletAddress } = req.body;

        // Get GSC ABI
        const contractPath = path.join(GSCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const GSCABI = contractJSON.abi;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GSCABI, GSCAddress);
        //console.log("contract: ", contract);

        // Prepare the transaction data
        const data = contract.methods.verifyCompany(companyWalletAddress).encodeABI();
        //console.log("data: ", data);

        // Fetch the nonce for the sender's address
        const senderAddress = MASTER_ADDRESS; // Replace with the sender's Ethereum address
        const nonce = await web3.eth.getTransactionCount(senderAddress);

        // Prepare the transaction object
        let currentGasPrice = await getCurrentGasPrice();

        const gasLimit = 200000; // Adjust the gas limit as needed
        const rawTransaction = {
            from: MASTER_ADDRESS,
            to: GSCAddress,
            gas: gasLimit,
            gasPrice: currentGasPrice,
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

/**
 * @swagger
 * /company/{id}:
 *   get:
 *     summary: Retrieve company details by ID
 *     tags: 
 *     - Company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the company to retrieve.
 *     responses:
 *       200:
 *         description: Details of the company.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found.
 *       500:
 *         description: Error retrieving company.
 */

// Retrieve company details by ID
router.get('/company/:id', async (req, res) => {
    try {
        const companyId = req.params.id;
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

/**
 * @swagger
 * /company/{id}:
 *   put:
 *     summary: Update company details by ID
 *     tags: 
 *     - Company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the company to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyUpdate'
 *     responses:
 *       200:
 *         description: Details of the updated company.
 *       404:
 *         description: Company not found.
 *       500:
 *         description: Error updating company.
 */

// Update company details by ID
router.put('/company/:id', async (req, res) => {
    try {
        const companyId = req.params.id;
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

/**
 * @swagger
 * /company/{id}:
 *   delete:
 *     summary: Delete company by ID
 *     tags: 
 *     - Company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the company to delete.
 *     responses:
 *       200:
 *         description: Details of the deleted company.
 *       404:
 *         description: Company not found.
 *       500:
 *         description: Error deleting company.
 */

// Delete company by ID
router.delete('/company/:id', async (req, res) => {
    try {
        const companyId = req.params.id;
        const deletedCompany = await Company.findByIdAndDelete(companyId);
        if (!deletedCompany) {
            return res.status(404).send('Company not found');
        }
        res.json(deletedCompany);
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).send('Error deleting company');
    }
});

module.exports = router;
