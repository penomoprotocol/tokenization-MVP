//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { ethers } = require('ethers');
const { web3, networkId, GSCAddress } = require('../config/web3Config');

// For debugging
console.log(web3.utils);
console.log(ethers.utils);

const fs = require('fs');
const path = require('path');

// Import Contract Artifacts
const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');

// Get GSC ABI
const contractPath = path.join(GSCBuild);
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const GSCABI = contractJSON.abi;
// Get SC ABI
const SCcontractPath = path.join(SCBuild);
const SCcontractJSON = JSON.parse(fs.readFileSync(SCcontractPath, 'utf8'));
const SCABI = SCcontractJSON.abi;
// Get TC ABI
const TCcontractPath = path.join(TCBuild);
const TCcontractJSON = JSON.parse(fs.readFileSync(TCcontractPath, 'utf8'));
const TCABI = TCcontractJSON.abi;

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;


const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const express = require('express');
const router = express.Router();

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Company = require('../models/CompanyModel');
const Contract = require('../models/TokenModel');
const Investor = require('../models/InvestorModel');


// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
    return gasPrice;
}


// Helper function to estimate gas and send a transaction
async function estimateAndSend(transaction, fromAddress, fromPrivateKey, toAddress, amountInWei) {
    // Fetch the current nonce
    let currentNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');

    // Estimate gas for the transaction
    const estimatedGas = await transaction.estimateGas({ from: fromAddress });

    const bufferGas = estimatedGas * 150n / 100n;  // Adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // Rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    // Prepare the transaction data with nonce
    const txData = {
        from: fromAddress,
        to: toAddress,
        data: transaction.encodeABI(),
        value: amountInWei, // Adding the value field for the amount being sent
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,
        nonce: currentNonce
    };

    // Sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(txData, fromPrivateKey);

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


// Helper function to serialize BigInt values in an object
function serializeBigIntInObject(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'bigint') {
            obj[key] = obj[key].toString();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            obj[key] = serializeBigIntInObject(obj[key]);
        }
    }
    return obj;
}

/**
 * @swagger
 * /api/investor/register:
 *   post:
 *     summary: Register an investor
 *     tags: 
 *     - Investor
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
 *         description: Successfully registered investor.
 *       500:
 *         description: Error registering investor.
 */

// Investor Registration
router.post('/investor/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        console.log("Original privateKey: ", privateKey);
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

/**
 * @swagger
 * /api/investor/login:
 *   post:
 *     summary: Login an investor
 *     tags: 
 *     - Investor
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
 *         description: Investor not found or Invalid credentials.
 *       500:
 *         description: Error logging in.
 */

//Investor Login
router.post('/investor/login', async (req, res) => {
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

/**
 * @swagger
 * /api/investor/verify:
 *   post:
 *     summary: Verify an investor (KYC) and add their wallet address to the GlobalStateContract whitelist.
 *     tags: 
 *       - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - investorId
 *             properties:
 *               investorId:
 *                 type: string
 *                 description: The unique identifier of the investor.
 *     responses:
 *       200:
 *         description: Investor successfully verified.
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: An error occurred or transaction failed.
 */

// TODO: update "verified" status in Investor db instance. Add kyc data, such as passport number, date and signature of KYC provider
// Investor KYC
router.post('/investor/verify', async (req, res) => {
    try {
        const { investorId } = req.body;

        // Fetch investor from the database
        const investor = await Investor.findById(investorId);
        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        // Get investor's public Ethereum address
        const investorWalletAddress = investor.ethereumPublicKey;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GSCABI, GSCAddress);

        // Prepare the transaction object
        const transaction = contract.methods.verifyInvestor(investorWalletAddress);

        // Send the transaction using the estimateAndSend helper function
        const receipt = await estimateAndSend(
            transaction,
            MASTER_ADDRESS,
            MASTER_PRIVATE_KEY,
            GSCAddress
        );

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({ message: 'Investor successfully verified' });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }

    } catch (error) {
        console.error('Error in investor verification:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});



/**
 * @swagger
 * /api/investor/buyToken:
 *   post:
 *     summary: Investor buys tokens
 *     tags: 
 *       - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - investorId
 *               - password
 *               - tokenAmount
 *               - serviceContractAddress
 *             properties:
 *               investorId:
 *                 type: string
 *                 description: The ID of the investor
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password to verify investor's identity
 *               tokenAmount:
 *                 type: number
 *                 description: The amount of tokens the investor wishes to buy
 *               serviceContractAddress:
 *                 type: string
 *                 description: The smart contract address to handle the token purchase
 *     responses:
 *       200:
 *         description: Successfully bought tokens.
 *       400:
 *         description: Bad request if service contract address is missing.
 *       401:
 *         description: Unauthorized if investor is not found or invalid credentials.
 *       500:
 *         description: Error buying tokens.
 */


// Handle investor token purchase
router.post('/investor/buyToken', async (req, res) => {
    try {
        const { investorId, password, tokenAmount, serviceContractAddress } = req.body;

        if (!serviceContractAddress) {
            return res.status(400).send('Missing service contract address.');
        }

        // Step 1: Get the investor from the database using the provided investorId
        const investor = await Investor.findById(investorId);
        if (!investor) {
            console.log('Investor not found:', investorId);
            return res.status(401).send('Investor not found');
        }

        // Step 2: Verify password
        const isPasswordValid = await bcrypt.compare(password, investor.password);
        if (!isPasswordValid) {
            console.log('Invalid credentials for investor ID:', investorId);
            return res.status(401).send('Invalid credentials');
        }

        console.log("investor.ethereumPublicKey: ", investor.ethereumPublicKey);

        // Step 3: Decrypt the private key
        const decryptedPrivateKey = decryptPrivateKey(investor.ethereumPrivateKey, SECRET_KEY);
        console.log("decryptedPrivateKey: ", decryptedPrivateKey);

        const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

        const tokenContractERC20Address = await ServiceContract.methods.tokenContractERC20().call();
        const tokenContractInstance = new web3.eth.Contract(TCABI, tokenContractERC20Address);

        const tokenPrice = await tokenContractInstance.methods.tokenPrice().call();

        // Assuming tokenAmount is the amount of tokens (not in Wei)
        const tokenAmountBigInt = BigInt(tokenAmount);
        const tokenPriceBigInt = BigInt(tokenPrice);
        const requiredWei = tokenPriceBigInt * tokenAmountBigInt;
        const requiredWeiString = requiredWei.toString();
        const tokenAmountWeiBigInt = BigInt(web3.utils.toWei(tokenAmountBigInt.toString(), 'ether'));


        console.log("tokenPrice: ", tokenPrice.toString());
        console.log("requiredWei: ", requiredWei.toString());
        console.log("tokenAmount: ", tokenAmountBigInt.toString());
        console.log("tokenAmountInWei: ", tokenAmountWeiBigInt.toString());

        const transaction = ServiceContract.methods.buyTokens(tokenAmountWeiBigInt.toString());
        const receipt = await estimateAndSend(transaction, investor.ethereumPublicKey, decryptedPrivateKey, serviceContractAddress, requiredWeiString);


        // const tokenPriceBigInt = BigInt(tokenPrice);
        // const requiredWei = tokenPriceBigInt * BigInt(tokenAmount.toString());

        // const transaction = ServiceContract.methods.buyTokens(tokenAmountWeiBigInt.toString());
        // const receipt = await estimateAndSend(transaction, investor.ethereumPublicKey, decryptedPrivateKey, serviceContractAddress, requiredWei.toString());


        const EtherRequiredABI = {
            name: 'EtherRequired',
            type: 'event',
            inputs: [{
                type: 'uint256',
                name: 'value',
                indexed: false
            }]
        };

        const EtherReceivedABI = {
            name: 'EtherReceived',
            type: 'event',
            inputs: [{
                type: 'uint256',
                name: 'value',
                indexed: false
            }]
        };

        const TokensPurchasedABI = {
            name: 'TokensPurchased',
            type: 'event',
            inputs: [{
                type: 'address',
                name: 'investor',
                indexed: true
            }, {
                type: 'uint256',
                name: 'amount',
                indexed: false
            }]
        };


        receipt.logs.forEach(log => {
            try {
                let decodedLog = null;

                // Decode EtherReceived Event
                try {
                    decodedLog = web3.eth.abi.decodeLog(EtherReceivedABI.inputs, log.data, log.topics);
                    console.log("EtherReceived Event:", decodedLog);
                } catch (error) {
                    // If decoding fails, it might be a different event
                }

                // Decode EtherRequired Event
                try {
                    decodedLog = web3.eth.abi.decodeLog(EtherRequiredABI.inputs, log.data, log.topics);
                    console.log("EtherRequired Event:", decodedLog);
                } catch (error) {
                    // If decoding fails, it might be a different event
                }

                // Decode TokensPurchased Event
                try {
                    decodedLog = web3.eth.abi.decodeLog(TokensPurchasedABI.inputs, log.data, log.topics);
                    console.log("TokensPurchased Event:", decodedLog);
                } catch (error) {
                    // If decoding fails, it might be a different event
                }


                if (!decodedLog) {
                    console.log("Unrecognized Event:", log);
                }

            } catch (error) {
                console.error("Error decoding log:", error);
            }
        });

        res.status(200).json({ receipt: serializeBigIntInObject(receipt) });

    } catch (error) {
        console.error('Error purchasing tokens:', error);
        res.status(500).send('Failed to purchase tokens.');
    }
});

/**
 * @swagger
 * /api/investor/sellToken:
 *   post:
 *     summary: Investor sells tokens
 *     tags: 
 *     - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully sold tokens.
 *       500:
 *         description: Error selling tokens.
 */

// Handle investor token sell
router.post('/investor/sellToken', (req, res) => {
    // Sell token via orderbook (has priority over tokens held by contract)
    // -> indicate amount to sell 
    // -> creates listing in SC (mapping of address -> amount)
    // -> gives allowance over amount to SC
    // -> If somebody wants to buy a token, first check open listings from other investors
});

/**
 * @swagger
 * /api/investor/{id}:
 *   get:
 *     summary: Retrieve investor details by ID
 *     tags: 
 *     - Investor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the investor to retrieve.
 *     responses:
 *       200:
 *         description: Details of the investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error retrieving investor.
 */

// Retrieve investor details by ID
router.get('/investor/:id', async (req, res) => {
    try {
        const investorId = req.params.id;
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

/**
 * @swagger
 * /api/investor/{id}:
 *   put:
 *     summary: Update investor details by ID
 *     tags: 
 *     - Investor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the investor to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Details of the updated investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error updating investor.
 */

// Update investor details by ID
router.put('/investor/:id', async (req, res) => {
    try {
        const investorId = req.params.id;
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

/**
 * @swagger
 * /api/investor/{id}:
 *   delete:
 *     summary: Delete investor by ID
 *     tags: 
 *     - Investor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the investor to delete.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Details of the deleted investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error deleting investor.
 */

// Delete investor by ID
router.delete('/investor/:id', async (req, res) => {
    try {
        const investorId = req.params.id;
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


module.exports = router;