//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('../config/web3Config_new');

const crypto = require('crypto');

const fs = require('fs');
const path = require('path');

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


const verifyToken = require('../middleware/jwtCheck');

// const ipfsClient = require('ipfs-http-client');
// const ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' }); // adjust if you're connecting to a different IPFS node

const { Sdk } = require('@peaq-network/sdk');
const { mnemonicGenerate } = require('@polkadot/util-crypto');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

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

// // // FUNCTIONS

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
 * /api/asset/register:
 *   post:
 *     summary: Register a new asset and create its DID.
 *     tags: 
 *       - Asset
 *     description: This endpoint registers a new asset for a company and generates a DID for the asset. It then returns the DID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: The unique identifier of the company registering the asset.
 *               companyPassword:
 *                 type: string
 *                 description: The password for company authentication.
 *               batteryName:
 *                 type: string
 *                 description: The name of the battery asset to register.
 *     responses:
 *       200:
 *         description: Successfully registered the asset and returned DID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 did:
 *                   type: string
 *                   description: The Decentralized Identifier (DID) of the newly registered asset.
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred while registering the asset.
 */


// TODO: Implement sdk integration once migrated to peaq testnet

router.post('/asset/register', async (req, res) => {
    try {
        const { companyId, companyPassword, batteryName } = req.body;

        // Validate company and password
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(401).send('Company not found');
        }

        const isPasswordValid = await bcrypt.compare(companyPassword, company.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid credentials');
        }

        // ACTUAL LOGIC WITH PEAQ SDK:
        // // Generate a mnemonic seed. In a production environment, ensure this is done securely.
        // const generateMnemonicSeed = () => mnemonicGenerate();

        // // Normally, you would secure the seed phrase and not generate a new one each time
        // const seed = generateMnemonicSeed();

        // // Ensure the seed has a balance before creating the DID
        // // This would typically be done off-line or in a secure environment, not within an API call
        // const sdkInstance = await Sdk.createInstance({
        //     baseUrl: 'wss://wsspc1-qa.agung.peaq.network',
        //     seed,
        // });

        //   const { didHash } = await sdkInstance.did.create({
        //     name,
        //     controller: controllerDid, // Set the controller to the company's DID
        //   });

        //   await sdkInstance.disconnect();

        // Generate a mock DID 
        const timestamp = new Date().getTime();
        const randomPart = crypto.randomBytes(8).toString('hex');
        const did = `did:peaq:${timestamp}-${randomPart}`;


        // Create a new Ethereum wallet for the asset
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        console.log("Original privateKey: ", privateKey);
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the company's secret key
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        // Create a new asset with the wallet details
        const newAsset = new Asset({
            name: batteryName,
            DID: did,
            publicKey: publicKey, // Store the public key (wallet address)
            privateKey: encryptedPrivateKey, // Store the encrypted private key
            companyId: companyId
            // CID and revenueStreamContracts can be added later when available
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
 * /api/asset/storeData:
 *   post:
 *     summary: Store asset data in IPFS and update the corresponding asset entry in the database.
 *     tags: 
 *       - Asset
 *     description: This endpoint stores asset-specific data on IPFS, updates the asset's database entry with the CID, and requires authentication with the company's credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - companyPassword
 *               - batteryDid
 *               - batteryType
 *               - capacity
 *               - voltage
 *             properties:
 *               batteryType:
 *                 type: string
 *                 description: The type of the battery.
 *               capacity:
 *                 type: string
 *                 description: The capacity of the battery in appropriate units.
 *               voltage:
 *                 type: string
 *                 description: The voltage of the battery in volts.
 *               batteryDid:
 *                 type: string
 *                 description: The DID of the asset to be updated.
 *               companyId:
 *                 type: string
 *                 description: The ID of the company owning the asset.
 *               companyPassword:
 *                 type: string
 *                 description: The password for the company for authentication purposes.
 *     responses:
 *       200:
 *         description: Successfully stored asset data and updated the asset entry in the database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cid:
 *                   type: string
 *                   description: The Content Identifier (CID) of the stored data in IPFS.
 *                 message:
 *                   type: string
 *                   description: Confirmation message about the asset entry update.
 *       400:
 *         description: Missing required fields in the request.
 *       404:
 *         description: Asset not found in the database.
 *       500:
 *         description: Error occurred while storing data or updating the asset entry.
 */

router.post('/asset/storeData', async (req, res) => {
    try {
        const { companyId, companyPassword, batteryDid, batteryType, capacity, voltage } = req.body;

        if (!batteryType || !capacity || !voltage || !batteryDid || !companyId || !companyPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate company and password
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(401).send('Company not found');
        }

        const isPasswordValid = await bcrypt.compare(companyPassword, company.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid credentials');
        }

        // Store battery data on IPFS (mocked for this example)
        // In a real-world scenario, you would store this data on IPFS and get a CID
        const timestamp = new Date().getTime();
        const randomPart = crypto.randomBytes(6).toString('hex');
        const cid = `ipfs://${randomPart}${timestamp}`;

        // Find the Asset using the DID
        const asset = await Asset.findOne({ DID: batteryDid });
        if (!asset) {
            return res.status(404).send('Asset not found');
        }

        // Update the Asset in the database with the new fields and CID
        asset.batteryType = batteryType;
        asset.capacity = capacity;
        asset.voltage = voltage;
        asset.CID = cid;
        await asset.save();

        // Respond with the IPFS CID and confirmation message
        res.status(200).json({
            message: 'Successfully stored battery data on IPFS and updated the Asset document.',
            cid: cid,
        });
    } catch (error) {
        console.error('Error updating asset with battery data:', error);
        res.status(500).json({ error: 'Failed to update asset with battery data' });
    }
});


/**
 * @swagger
 * /api/asset:
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
// Retrieve all assets
router.get('/asset', async (req, res) => {
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
 * /api/asset/company/{companyId}:
 *   get:
 *     summary: Retrieve assets by company ID
 *     tags: 
 *       - Asset
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         description: Company ID to retrieve assets for.
 *     responses:
 *       200:
 *         description: An array of assets for the given company.
 *       404:
 *         description: No assets found for the given company.
 *       500:
 *         description: Server error
 */
// Retrieve assets by companyId
router.get('/asset/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const assets = await Asset.find({ companyId: companyId });
        if (!assets || assets.length === 0) {
            return res.status(404).send('No assets found for the given company.');
        }
        res.status(200).json(assets);
    } catch (error) {
        console.error('Error retrieving assets by company ID:', error);
        res.status(500).send('Error retrieving assets by company ID.');
    }
});

/**
 * @swagger
 * /api/asset/did/{did}:
 *   get:
 *     summary: Retrieve an asset by DID
 *     tags: 
 *       - Asset
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         description: Digital Identifier of the asset to retrieve.
 *     responses:
 *       200:
 *         description: Asset object.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Server error
 */
// Retrieve an asset by DID
router.get('/asset/did/:did', async (req, res) => {
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
 * /api/asset/did/{did}:
 *   put:
 *     summary: Update asset details by DID
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         description: The DID of the asset to update.
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

router.put('/asset/did/:did', (req, res) => {
    // Update asset details
});

/**
 * @swagger
 * /api/asset/did/{did}:
 *   delete:
 *     summary: Delete asset by DID
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         description: The DID of the asset to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted asset.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error deleting asset.
 */

router.delete('/asset/did/:did', (req, res) => {
    // Delete asset 
});

module.exports = router;