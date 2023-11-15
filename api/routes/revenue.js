//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('../config/web3Config');

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


// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
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

const decryptPrivateKey = (encryptedKey, SECRET_KEY) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
};

// Generic function to deploy a contract
async function deployContract(contractABI, contractBytecode, constructorArgs) {
    const Contract = new web3.eth.Contract(contractABI);

    // Create the deployment data
    const deploymentData = Contract.deploy({
        data: contractBytecode,
        arguments: constructorArgs
    });

    // Estimate gas for the deployment and add buffer
    const estimatedGas = await deploymentData.estimateGas({ from: MASTER_ADDRESS });
    const bufferGas = estimatedGas * 110n / 100n;
    const roundedGas = bufferGas + (10n - bufferGas % 10n);
    let currentGasPrice = await getCurrentGasPrice();

    // Prepare the transaction data
    const deployTx = {
        data: deploymentData.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,
        from: MASTER_ADDRESS
    };

    // Sign the transaction with the master's private key
    const signedTx = await web3.eth.accounts.signTransaction(deployTx, MASTER_PRIVATE_KEY);

    // Send the signed transaction and receive the receipt
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt.contractAddress;
}



/**
 * @swagger
 * /api/revenue/rental:
 *   post:
 *     summary: Deploy "Rental Renvenue Contract" for generating revenue by rental of battery asset.
 *     description: Deploys RentalRenvenueContract and updates the Asset, Token and Revenue entries in the database with the new RentalRevenueContract address.
 *     tags: 
 *       - Revenue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceContractAddress
 *               - pricePerUnit
 *               - batteryDid
 *               - unit
 *               - currency
 *             properties:
 *               serviceContractAddress:
 *                 type: string
 *                 description: Ethereum address of the service contract.
 *               pricePerUnit:
 *                 type: number
 *                 format: float
 *                 description: Price per unit (e.g., kWh) in wei.
 *               unit:
 *                 type: string
 *                 description: The unit of the price (e.g., 'kWh', 'minute').
 *               currency:
 *                 type: string
 *                 description: The currency of the price (e.g., 'USDC').
 *               batteryDid:
 *                 type: string
 *                 description: DID of the battery asset.
 *     responses:
 *       200:
 *         description: Revenue stream contract deployed and connected.
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred during deployment.
 */


router.post('/revenue/rental', async (req, res) => {
    try {
        const { serviceContractAddress, pricePerUnit, batteryDid, unit, currency } = req.body;

        // Validate inputs
        if (!serviceContractAddress || !pricePerUnit || !batteryDid || !unit || !currency) {
            return res.status(400).send('Missing required parameters');
        }

        // Fetch the asset and contract from the database
        const asset = await Asset.findOne({ DID: batteryDid });
        const contract = await Contract.findOne({ serviceContractAddress });

        if (!asset || !contract) {
            return res.status(404).send('Asset or Contract not found');
        }

        // Prepare contract ABI and bytecode
        const RSCContractPath = path.join(RSCBuild);
        const RSCContractJSON = JSON.parse(fs.readFileSync(RSCContractPath, 'utf8'));
        const contractABI = RSCContractJSON.abi;
        const contractBytecode = RSCContractJSON.bytecode;
        const constructorArgs = [serviceContractAddress, web3.utils.toWei(pricePerUnit.toString(), 'ether'), asset.publicKey];

        // Deploy the contract
        const revenueStreamContractAddress = await deployContract(contractABI, contractBytecode, constructorArgs);

        // Update the Asset and Contract entries in the database
        asset.revenueStreamContracts.push(revenueStreamContractAddress);
        await asset.save();

        contract.revenueStreamContractAddresses.push(revenueStreamContractAddress);
        await contract.save();

        // Create or update a Revenue entry
        const revenueData = {
            type: 'rental',
            serviceContractAddress,
            revenueStreamContractAddress,
            unitPrice: pricePerUnit,
            unit,
            currency,
            assetDID: batteryDid,
            companyId: asset.companyId,
        };

        let revenue = await Revenue.findOne({ serviceContractAddress });
        if (revenue) {
            await Revenue.updateOne({ serviceContractAddress }, revenueData);
        } else {
            revenue = new Revenue(revenueData);
            await revenue.save();
        }

        // Respond with the contract's deployed address
        res.status(200).json({
            message: 'Revenue stream contract deployed successfully',
            contractAddress: revenueStreamContractAddress
        });

    } catch (error) {
        console.error('Error deploying contract:', error);
        res.status(500).send('Failed to deploy contract');
    }
});


/**
 * @swagger
 * /api/revenue/grid:
 *   post:
 *     summary: Deploy "Grid Revenue Contract" for managing FCR, aFRR, or mFRR services provided by battery asset (Future Release)
 *     description: Deploys a GridRevenueContract instance and connects it to an existing ServiceContract. Updates the Asset, Token and Revenue entries in the database with the new GridRevenueContract address.
 *     tags: 
 *       - Revenue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceContractAddress
 *               - frequencyRegulationType
 *               - currency
 *               - batteryDid
 *             properties:
 *               serviceContractAddress:
 *                 type: string
 *                 description: Ethereum address of the service contract.
 *               frequencyRegulationType:
 *                 type: string
 *                 enum: [FCR, aFRR, mFRR]
 *                 description: Type of frequency regulation service (FCR, aFRR, or mFRR).
 *               currency:
 *                 type: string
 *                 description: The currency of the price (e.g., 'USDC').
 *               batteryDid:
 *                 type: string
 *                 description: DID of the battery asset providing the service.
 *     responses:
 *       200:
 *         description: Grid Service Revenue Contract deployed successfully.
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred during deployment.
 */

router.post('/revenue/grid', async (req, res) => {
    try {
        const { batteryDid, serviceContractAddress, frequencyRegulationType, currency} = req.body;

        if (!serviceContractAddress || !frequencyRegulationType || !currency || !batteryDid) {
            return res.status(400).send('Missing required parameters');
        }

        const asset = await Asset.findOne({ DID: batteryDid });
        const contract = await Contract.findOne({ serviceContractAddress });

        if (!asset || !contract) {
            return res.status(404).send('Asset or Contract not found');
        }

        const batteryPublicKey = asset.publicKey || "0x...";

        // Read contract's ABI and bytecode, deploy contract, and sign transaction (omitted for brevity)

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        asset.revenueStreamContracts.push(receipt.contractAddress);
        await asset.save();

        contract.revenueStreamContractAddresses.push(receipt.contractAddress);
        await contract.save();

        const revenueData = {
            type: 'grid',
            serviceContractAddress,
            revenueStreamContractAddress: receipt.contractAddress,
            currency,
            assetDID: batteryDid,
            companyId: asset.companyId,
        };

        let revenue = await Revenue.findOne({ serviceContractAddress });
        if (revenue) {
            await Revenue.updateOne({ serviceContractAddress }, revenueData);
        } else {
            revenue = new Revenue(revenueData);
            await revenue.save();
        }

        res.status(200).json({
            message: 'Grid Service Revenue Contract deployed successfully',
            contractAddress: receipt.contractAddress
        });

    } catch (error) {
        console.error('Error deploying Grid Service Revenue Contract:', error);
        res.status(500).send('Failed to deploy Grid Service Revenue Contract');
    }
});

/**
 * @swagger
 * /api/revenue/arbitrage:
 *   post:
 *     summary: Deploy "Arbitrage Revenue Contract" to generate revenue stream for battery asset by trading energy, using price arbitrage. (Future Release)
 *     description: Deploys a "ArbitrageRevenueContract" instance and connects it to an existing ServiceContract. Updates the Asset, Token and Revenue entries in the database with the new ArbitrageRevenueContract address.
 *     tags: 
 *       - Revenue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceContractAddress
 *               - frequencyRegulationType
 *               - currency
 *               - batteryDid
 *             properties:
 *               serviceContractAddress:
 *                 type: string
 *                 description: Ethereum address of the service contract.
 *               currency:
 *                 type: string
 *                 description: The currency of the price (e.g., 'USDC').
 *               batteryDid:
 *                 type: string
 *                 description: DID of the battery asset providing the service.
 *     responses:
 *       200:
 *         description: Arbitrage Revenue Contract deployed successfully.
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred during deployment.
 */

router.post('/revenue/arbitrage', async (req, res) => {
    try {
        const { batteryDid, serviceContractAddress, currency} = req.body;

        if (!serviceContractAddress || !currency || !batteryDid) {
            return res.status(400).send('Missing required parameters');
        }

        const asset = await Asset.findOne({ DID: batteryDid });
        const contract = await Contract.findOne({ serviceContractAddress });

        if (!asset || !contract) {
            return res.status(404).send('Asset or Contract not found');
        }

        const batteryPublicKey = asset.publicKey || "0x...";

        // Read contract's ABI and bytecode, deploy contract, and sign transaction (omitted for brevity)

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        asset.revenueStreamContracts.push(receipt.contractAddress);
        await asset.save();

        contract.revenueStreamContractAddresses.push(receipt.contractAddress);
        await contract.save();

        const revenueData = {
            type: 'arbitrage',
            serviceContractAddress,
            revenueStreamContractAddress: receipt.contractAddress,
            currency,
            assetDID: batteryDid,
            companyId: asset.companyId,
        };

        let revenue = await Revenue.findOne({ serviceContractAddress });
        if (revenue) {
            await Revenue.updateOne({ serviceContractAddress }, revenueData);
        } else {
            revenue = new Revenue(revenueData);
            await revenue.save();
        }

        res.status(200).json({
            message: 'Arbitrage Revenue Contract deployed successfully',
            contractAddress: receipt.contractAddress
        });

    } catch (error) {
        console.error('Error deploying Arbitrage Revenue Contract:', error);
        res.status(500).send('Failed to deploy Arbitrage Revenue Contract');
    }
});


// Swagger JSDoc
/**
 * @swagger
 * /api/revenue/data:
 *   post:
 *     summary: Deploy "Data Revenue Contract" to generete revenue for battery asset by selling data (Future Release)
 *     description: Deploys a DataRevenueContract instance and connects it to an existing ServiceContract. Updates the Asset, Token and Revenue entries in the database with the new DataRevenueContract address.
 *     tags: 
 *       - Revenue 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceContractAddress
 *               - dataPrice
 *               - unit
 *               - currency
 *               - batteryDid
 *             properties:
 *               serviceContractAddress:
 *                 type: string
 *                 description: Ethereum address of the service contract to connect with.
 *               dataPrice:
 *                 type: number
 *                 format: float
 *                 description: Price per unit for data sharing or analysis services.
 *               unit:
 *                 type: string
 *                 description: The unit of data pricing (e.g., 'kilobyte', 'transaction').
 *               currency:
 *                 type: string
 *                 description: The currency of the price (e.g., 'USDC').
 *               batteryDid:
 *                 type: string
 *                 description: DID of the battery asset participating in data monetization.
 *     responses:
 *       200:
 *         description: Data Revenue Contract deployed successfully (Future Release).
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred during the deployment process (Future Release).
 */


router.post('/revenue/data', async (req, res) => {
    try {
        const {batteryDid,serviceContractAddress, dataPrice, unit, currency } = req.body;

        if (!serviceContractAddress || !dataPrice || !unit || !currency || !batteryDid) {
            return res.status(400).send('Missing required parameters');
        }

        const asset = await Asset.findOne({ DID: batteryDid });
        const contract = await Contract.findOne({ serviceContractAddress });

        if (!asset || !contract) {
            return res.status(404).send('Asset or Contract not found');
        }

        const batteryPublicKey = asset.publicKey || "0x...";

        // Read contract's ABI and bytecode, deploy contract, and sign transaction (omitted for brevity)

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        asset.revenueStreamContracts.push(receipt.contractAddress);
        await asset.save();

        contract.revenueStreamContractAddresses.push(receipt.contractAddress);
        await contract.save();

        const revenueData = {
            type: 'data',
            serviceContractAddress,
            revenueStreamContractAddress: receipt.contractAddress,
            unitPrice: dataPrice,
            unit,
            currency,
            assetDID: batteryDid,
            companyId: asset.companyId,
        };

        let revenue = await Revenue.findOne({ serviceContractAddress });
        if (revenue) {
            await Revenue.updateOne({ serviceContractAddress }, revenueData);
        } else {
            revenue = new Revenue(revenueData);
            await revenue.save();
        }

        res.status(200).json({
            message: 'Data Revenue Contract deployed successfully',
            contractAddress: receipt.contractAddress
        });

    } catch (error) {
        console.error('Error deploying Data Revenue Contract:', error);
        res.status(500).send('Failed to deploy Data Revenue Contract');
    }
});


/**
 * @swagger
 * /api/revenue/carbon:
 *   post:
 *     summary: Deploy "Carbon Revenue Contract" to generate revenue for battery asset by minting and selling Carbon Credits, based on avoided CO2 (Future Release)
 *     description: Deploys a CarbonRevenueContract instance and connects it to an existing ServiceContract. Updates the Asset, Token and Revenue entries in the database with the new CarbonRevenueContract address.
 *     tags: 
 *       - Revenue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceContractAddress
 *               - carbonCreditPrice
 *               - unit
 *               - currency
 *               - batteryDid
 *             properties:
 *               serviceContractAddress:
 *                 type: string
 *                 description: Ethereum address of the service contract.
 *               carbonCreditPrice:
 *                 type: number
 *                 format: float
 *                 description: Price per unit for carbon credit trading.
 *               unit:
 *                 type: string
 *                 description: The unit of carbon credit pricing (e.g., 'tCO2').
 *               currency:
 *                 type: string
 *                 description: The currency of the price (e.g., 'USDC').
 *               batteryDid:
 *                 type: string
 *                 description: DID of the battery asset participating in carbon credit trading.
 *     responses:
 *       200:
 *         description: Carbon Revenue Contract deployed successfully (Future Release).
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred during the deployment process (Future Release).
 */


router.post('/revenue/carbon', async (req, res) => {
    try {
        const { serviceContractAddress, carbonCreditPrice, unit, currency, batteryDid } = req.body;

        if (!serviceContractAddress || !carbonCreditPrice || !unit || !currency || !batteryDid) {
            return res.status(400).send('Missing required parameters');
        }

        const asset = await Asset.findOne({ DID: batteryDid });
        const contract = await Contract.findOne({ serviceContractAddress });

        if (!asset || !contract) {
            return res.status(404).send('Asset or Contract not found');
        }

        const batteryPublicKey = asset.publicKey || "0x...";

        // Read contract's ABI and bytecode, deploy contract, and sign transaction (omitted for brevity)

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        asset.revenueStreamContracts.push(receipt.contractAddress);
        await asset.save();

        contract.revenueStreamContractAddresses.push(receipt.contractAddress);
        await contract.save();

        const revenueData = {
            type: 'carbon',
            serviceContractAddress,
            revenueStreamContractAddress: receipt.contractAddress,
            unitPrice: carbonCreditPrice,
            unit,
            currency,
            assetDID: batteryDid,
            companyId: asset.companyId,
        };

        let revenue = await Revenue.findOne({ serviceContractAddress });
        if (revenue) {
            await Revenue.updateOne({ serviceContractAddress }, revenueData);
        } else {
            revenue = new Revenue(revenueData);
            await revenue.save();
        }

        res.status(200).json({
            message: 'Carbon Revenue Contract deployed successfully',
            contractAddress: receipt.contractAddress
        });

    } catch (error) {
        console.error('Error deploying Carbon Revenue Contract:', error);
        res.status(500).send('Failed to deploy Carbon Revenue Contract');
    }
});


/**
 * @swagger
 * /api/revenue/{address}:
 *   get:
 *     summary: Retrieve revenue stream details by address
 *     tags: 
 *     - Revenue
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The address of the asset to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved asset details.
 *       404:
 *         description: Revenue not found.
 *       500:
 *         description: Error retrieving asset.
 */

router.get('/revenue/:address', (req, res) => {
    // Retrieve asset details
});

/**
 * @swagger
 * /api/revenue/{address}:
 *   put:
 *     summary: Update asset details by address
 *     tags: 
 *     - Revenue
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The address of the asset to update.
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
 *         description: Revenue not found.
 *       500:
 *         description: Error updating asset.
 */

router.put('/revenue/:address', (req, res) => {
    // Update asset details
});

/**
 * @swagger
 * /api/revenue/{address}:
 *   delete:
 *     summary: Delete asset by ID
 *     tags: 
 *     - Revenue
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the asset to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted asset.
 *       404:
 *         description: Revenue not found.
 *       500:
 *         description: Error deleting asset.
 */

router.delete('/revenue/:address', (req, res) => {
    // Delete asset 
});

module.exports = router;