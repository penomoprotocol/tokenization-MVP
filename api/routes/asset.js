//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('../config/web3Config_AGNG');

const crypto = require('crypto');

const fs = require('fs');
const path = require('path');

const verifyToken = require('../middleware/jwtCheck');

const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');
const DIDBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'DID.sol', 'DID.json');

// Read the DID contract's ABI
const contractPath = path.join(DIDBuild);
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const DIDABI = contractJSON.abi;

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const express = require('express');
const router = express.Router();


// const ipfsClient = require('ipfs-http-client');
// const ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' }); // adjust if you're connecting to a different IPFS node

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;
const SEED = process.env.SEED;


// Initialize peaq sdk
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { Sdk } = require('@peaq-network/sdk');

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Company = require('../models/CompanyModel');
const Contract = require('../models/TokenModel');
const Investor = require('../models/InvestorModel');

// Set up DID contract

// The address of the deployed DID contract (replace with actual address)
const DIDContractAddress = '0x0000000000000000000000000000000000000800';

// Initialize the contract with web3
const DIDContract = new web3.eth.Contract(DIDABI, DIDContractAddress);

////// FUNCTIONS //////

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
    console.log(`Current Gas Price: ${gasPrice}`);
    gasPrice = BigInt(gasPrice) * 200n / 100n;
    return gasPrice;
}

// Helper function to estimate gas and send a transaction
async function estimateAndSend(transaction, fromAddress, fromPrivateKey, toAddress) {

    // Fetch the current nonce
    let currentNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');

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
    const signedTx = await web3.eth.accounts.signTransaction(txData, fromPrivateKey);

    // Send the signed transaction
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

// Function to create a new Ethereum wallet and return the private key
const createWallet = () => {
    const wallet = web3.eth.accounts.create();
    return wallet;
};

// Function to encrypt and decrypt private keys
const encryptPrivateKey = (privateKey, SECRET_KEY) => {
    const encrypted = CryptoJS.AES.encrypt(privateKey, SECRET_KEY).toString();
    return encrypted;
};

// Decrypt private key function
const decryptPrivateKey = (encryptedKey, SECRET_KEY) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
};

// Create DID function
const createPeaqDID = async (name, seed) => {
    const sdkInstance = await Sdk.createInstance({
        baseUrl: "wss://wsspc1-qa.agung.peaq.network",
        seed
    });

    const { hash } = await sdkInstance.did.create({
        name,
    });

    const hexHash = '0x' + Array.from(hash)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

    console.log("DID created. See tx: ", hexHash);

    // Extract DID document
    const did = await sdkInstance.did.read({ name, });

    await sdkInstance.disconnect();

    return did;
};

// Read DID function
const readDID = async (sdk, name) => {
    const did = await sdk.did.read(name, SEED);
    console.log(did);
    return did;
};


////// ROUTES //////

//// For beta ////

// Register asset
/**
 * @swagger
 * /api/asset/register:
 *   post:
 *     summary: Registers a new asset and associates it with a company.
 *     tags: [Asset]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assetType:
 *                 type: string
 *                 description: Type of the asset (e.g., battery, solar panel).
 *               brand:
 *                 type: string
 *                 description: Brand of the asset.
 *               model:
 *                 type: string
 *                 description: Model of the asset.
 *               serialNumber:
 *                 type: string
 *                 description: Serial number of the asset.
 *               capacity:
 *                 type: string
 *                 description: Capacity of the asset (e.g., in kWh for batteries).
 *               power:
 *                 type: string
 *                 description: Power rating of the asset (e.g., in kW).
 *               location:
 *                 type: string
 *                 description: Geographical location of the asset.
 *               assetValue:
 *                 type: number
 *                 description: Monetary value of the asset.
 *               revenueStreams:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     details:
 *                       type: string
 *                 description: Expected revenue streams from the asset.
 *               financingGoal:
 *                 type: number
 *                 description: The funding goal for the asset.
 *               fundUsage:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     description:
 *                       type: string
 *                 description: Details on how the funds will be used.
 *     responses:
 *       200:
 *         description: Asset successfully registered. Returns DID and public key.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newAsset:
 *                   $ref: '#/models/AssetModel'
 *       401:
 *         description: Unauthorized. Company not found or invalid credentials.
 *       500:
 *         description: Server error or unable to register the asset.
 */
router.post('/asset/register', verifyToken, async (req, res) => {
    try {
        const companyId = req.user.id; // ID is retrieved from the decoded JWT token
        const company = await Company.findById(companyId);

        const {
            assetType,
            brand,
            model,
            serialNumber,
            capacity,
            power,
            location,
            assetValue,
            revenueStreams,
            financingGoal,
            fundUsage
        } = req.body;

        // Create DID using peaq SDK
        let did;
        try {
            did = await createPeaqDID(serialNumber, SEED);
        } catch (error) {
            console.error(`Error creating peaq DID: ${error}`);
        }

        // Create a new Ethereum wallet for the asset
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the company's secret key
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        // Create a new asset with the wallet details
        const newAsset = new Asset({
            assetType: assetType,
            brand: brand,
            model: model,
            serialNumber: serialNumber,
            capacity: capacity,
            power: power,
            location: location,
            assetValue: assetValue,
            revenueStreams: revenueStreams,
            financingGoal: financingGoal,
            fundUsage: fundUsage,
            DID: did,
            publicKey: publicKey,
            privateKey: encryptedPrivateKey,
            companyId: companyId
        });

        // Save the asset to the database
        await newAsset.save();

        // Return the DID and public key to the caller
        res.status(200).json({
            message: 'Successfully registered battery asset.',
            newAsset,
        });

    } catch (error) {
        console.error('Error registering asset:', error);
        res.status(500).send('Error registering asset.');
    }

});

/**
 * @swagger
 * /api/asset/all:
 *   get:
 *     summary: Retrieve all assets
 *     tags: 
 *       - Asset
 *     responses:
 *       200:
 *         description: A list of assets.
 *       500:
 *         description: Server error
 */
// Get all assets
router.get('/asset/all', async (req, res) => {
    try {
        const assets = await Asset.find({});
        res.status(200).json(assets);
    } catch (error) {
        console.error('Error retrieving all assets:', error);
        res.status(500).send('Error retrieving all assets.');
    }
});

/**
 * @swagger
 * /api/asset/{assetId}:
 *   get:
 *     summary: Retrieve an asset by DID
 *     tags: 
 *       - Asset
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         description: Unique ientifier of the asset to retrieve.
 *     responses:
 *       200:
 *         description: Asset object.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Server error
 */
// Get asset
router.get('/asset/:assetId', async (req, res) => {
    try {
        const { did } = req.params;
        const asset = await Asset.findOne({ DID: did });
        if (!asset) {
            return res.status(404).send('Asset not found.');
        }
        res.status(200).json(asset);
    } catch (error) {
        console.error('Error retrieving asset by DID:', error);
        res.status(500).send('Error retrieving asset by DID.');
    }
});

/**
 * @swagger
 * /api/asset/{assetId}:
 *   put:
 *     summary: Update asset details by assetId
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         description: The id of the asset to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated asset details.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error updating asset.
 */
// Update asset
router.put('/asset/:assetId', (req, res) => {
});

/**
 * @swagger
 * /api/asset/{assetId}:
 *   delete:
 *     summary: Delete asset by assetId
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         description: The id of the asset to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted asset.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error deleting asset.
 */
// Delete asset 
router.delete('/asset/:assetId', (req, res) => {
});



module.exports = router;