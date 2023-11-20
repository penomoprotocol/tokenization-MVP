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

// Get SC ABI
const contractPath = path.join(SCBuild);
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const SCABI = contractJSON.abi;
// Get TC ABI
const TCcontractPath = path.join(TCBuild);
const TCcontractJSON = JSON.parse(fs.readFileSync(TCcontractPath, 'utf8'));
const TCABI = TCcontractJSON.abi;
// Get LC ABI
const LCcontractPath = path.join(LCBuild);
const LCcontractJSON = JSON.parse(fs.readFileSync(LCcontractPath, 'utf8'));
const LCABI = LCcontractJSON.abi;
// Get RDC ABI
const RDCcontractPath = path.join(RDCBuild);
const RDCcontractJSON = JSON.parse(fs.readFileSync(RDCcontractPath, 'utf8'));
const RDCABI = RDCcontractJSON.abi;
// Get DID ABI
const DIDContractPath = path.join(DIDBuild);
const DIDContractJSON = JSON.parse(fs.readFileSync(DIDContractPath, 'utf8'));
const DIDABI = DIDContractJSON.abi;


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

// Set up DID contract

// The address of the deployed DID contract (replace with actual address)
const DIDContractAddress = '0x0000000000000000000000000000000000000800';

// Initialize the contract with web3
const DIDContract = new web3.eth.Contract(DIDABI, DIDContractAddress);

// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice();
    console.log(`Current Gas Price: ${gasPrice}`);
    gasPrice = BigInt(gasPrice) * 200n / 100n;
    return gasPrice;
}


// Helper function to estimate gas and send a transaction
async function estimateAndSend(transaction, fromAddress, fromPrivateKey, toAddress) {
    try {
        let currentNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');
        console.log(`Current Nonce: ${currentNonce}`);

        const estimatedGas = await transaction.estimateGas({ from: fromAddress });
        console.log(`Estimated Gas: ${estimatedGas}`);

        const bufferGas = estimatedGas * 110n / 100n;
        const roundedGas = bufferGas + (10n - bufferGas % 10n);
        let currentGasPrice = await getCurrentGasPrice();

        const txData = {
            from: fromAddress,
            to: toAddress,
            data: transaction.encodeABI(),
            gas: roundedGas.toString(),
            gasPrice: currentGasPrice,
            nonce: currentNonce
        };

        console.log('Transaction Data:', txData);

        const signedTx = await web3.eth.accounts.signTransaction(txData, fromPrivateKey);
        console.log('Signed Transaction:', signedTx);

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Transaction Receipt:', receipt);
        return receipt;
    } catch (error) {
        console.error('Error in estimateAndSend:', error);
        throw error;
    }
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


// // // DEPLOYMENT SCRIPTS // TODO: Refactor into separate file and import

// Deploy Service Contract
async function deployServiceContract(GSCAddress) {
    const contractPath = path.join(SCBuild);
    const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const ServiceContract = new web3.eth.Contract(contractJSON.abi);

    const deploymentData = ServiceContract.deploy({
        data: contractJSON.bytecode,
        arguments: [GSCAddress]
    });

    const estimatedGas = await deploymentData.estimateGas({
        from: MASTER_ADDRESS
    });

    const bufferGas = estimatedGas * 110n / 100n;  // adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    const deployTx = {
        data: deploymentData.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,  // Using the fetched gas price
        from: MASTER_ADDRESS
    };

    const signedTx = await web3.eth.accounts.signTransaction(deployTx, MASTER_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);

    return receipt.contractAddress;
}

// Deploy Token Contract
async function deployTokenContract(DIDs, CIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress) {
    const contractPath = path.join(TCBuild);
    const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const TokenContract = new web3.eth.Contract(contractJSON.abi);

    const constructorArgs = {
        penomoWallet: MASTER_ADDRESS,
        globalStateAddress: GSCAddress,
        serviceContractAddress: serviceContractAddress,
        name: name,
        symbol: symbol,
        revenueShare: revenueShare,
        contractTerm: contractTerm,
        maxTokenSupply: maxTokenSupply,
        tokenPrice: tokenPrice 
    };

    const deploymentData = TokenContract.deploy({
        data: contractJSON.bytecode,
        arguments: [constructorArgs, DIDs, CIDs, revenueGoals]
    });

    const estimatedGas = await deploymentData.estimateGas({
        from: MASTER_ADDRESS
    });


    const bufferGas = estimatedGas * 110n / 100n;  // adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    const deployTx = {
        data: deploymentData.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,  // Using the fetched gas price
        from: MASTER_ADDRESS
    };

    const signedTx = await web3.eth.accounts.signTransaction(deployTx, MASTER_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);

    return receipt.contractAddress;
}

// Deploy Liquidity Contract
async function deployLiquidityContract(serviceContractAddress, BBWallet, PenomoWallet) {
    const contractPath = path.join(LCBuild); // assuming LCBuild is the build path for LiquidityContract
    const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const LiquidityContract = new web3.eth.Contract(contractJSON.abi);

    const deploymentData = LiquidityContract.deploy({
        data: contractJSON.bytecode,
        arguments: [serviceContractAddress, BBWallet, PenomoWallet]
    });

    const estimatedGas = await deploymentData.estimateGas({
        from: MASTER_ADDRESS
    });

    const bufferGas = estimatedGas * 110n / 100n;  // adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    const deployTx = {
        data: deploymentData.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,  // Using the fetched gas price
        from: MASTER_ADDRESS
    };

    const signedTx = await web3.eth.accounts.signTransaction(deployTx, MASTER_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);

    return receipt.contractAddress;
}

// Deploy Revenue Distribution Contract
async function deployRevenueDistributionContract(serviceContractAddress, tokenContractERC20Address, liquidityContractAddress) {
    const contractPath = path.join(RDCBuild); // assuming RDCBuild is the build path for RevenueDistributionContract
    const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const RevenueDistributionContract = new web3.eth.Contract(contractJSON.abi);

    const deploymentData = RevenueDistributionContract.deploy({
        data: contractJSON.bytecode,
        arguments: [serviceContractAddress, tokenContractERC20Address, liquidityContractAddress]
    });

    const estimatedGas = await deploymentData.estimateGas({
        from: MASTER_ADDRESS
    });

    const bufferGas = estimatedGas * 110n / 100n;  // adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    const deployTx = {
        data: deploymentData.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,  // Using the fetched gas price
        from: MASTER_ADDRESS
    };

    const signedTx = await web3.eth.accounts.signTransaction(deployTx, MASTER_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);

    return receipt.contractAddress;
}



// /**
//  * @swagger
//  * /api/token/deploy:
//  *   post:
//  *     summary: Tokenize an asset
//  *     tags: 
//  *       - Token
//  *     description: Deploy contracts to tokenize an asset with provided details.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - companyId
//  *               - password
//  *               - DIDs
//  *               - name
//  *               - symbol
//  *               - revenueShare
//  *               - contractTerm
//  *               - maxTokenSupply
//  *               - tokenPrice
//  *             properties:
//  *               companyId:
//  *                 type: string
//  *                 description: ID of the company initiating tokenization.
//  *               password:
//  *                 type: string
//  *                 description: Password for company authentication.
//  *               DIDs:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 description: Array of Digital Identity Identifiers.
//  *               name:
//  *                 type: string
//  *                 description: Name of the token.
//  *               symbol:
//  *                 type: string
//  *                 description: Symbol of the token.
//  *               revenueShare:
//  *                 type: number
//  *                 description: Percentage of revenue share.
//  *               contractTerm:
//  *                 type: number
//  *                 description: Term length of the contract.
//  *               maxTokenSupply:
//  *                 type: number
//  *                 description: Maximum supply of the tokens.
//  *               tokenPrice:
//  *                 type: number
//  *                 description: Price of each token.
//  *     responses:
//  *       200:
//  *         description: Successfully tokenized asset and returned contract addresses.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 tokenContractAddress:
//  *                   type: string
//  *                 serviceContractAddress:
//  *                   type: string
//  *                 liquidityContractAddress:
//  *                   type: string
//  *                 revenueDistributionContractAddress:
//  *                   type: string
//  *       400:
//  *         description: Missing required parameters.
//  *       500:
//  *         description: Failed to deploy the contracts.
//  */

// router.post('/token/deploy', async (req, res) => {
//     try {
//         // Get data from the request
//         const { companyId, password, DIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice } = req.body;

//         if (!companyId || !password || !DIDs || !revenueGoals || !name || !symbol || !revenueShare || !contractTerm || !maxTokenSupply || !tokenPrice) {
//             return res.status(400).send('Missing required parameters.');
//         }

//         // Step 1: Get the company from the database using the provided companyId
//         const company = await Company.findById(companyId);
//         if (!company) {
//             console.log('Company not found:', companyId);
//             return res.status(401).send('Company not found');
//         }

//         // Step 2: Verify password
//         const isPasswordValid = await bcrypt.compare(password, company.password);
//         if (!isPasswordValid) {
//             console.log('Invalid credentials for company ID:', companyId);
//             return res.status(401).send('Invalid credentials');
//         }

//         console.log("company.ethereumPublicKey: ", company.ethereumPublicKey);
//         // companyPublicKey =  company.ethereumPublicKey;
//         companyPublicKey = "0x59D40fDF369bDB84F43d6c1e3FdCA2eb0C977F5a";

//         // Deploy the ServiceContract and get its address
//         const serviceContractAddress = await deployServiceContract(GSCAddress);
//         console.log("serviceContractAddress: ", serviceContractAddress);

//         // Deploy the TokenContract using the ServiceContract's address
//         const tokenContractAddress = await deployTokenContract(DIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress);
//         console.log("tokenContractAddress: ", tokenContractAddress);

//         // Deploy LiquidityContract
//         const liquidityContractAddress = await deployLiquidityContract(serviceContractAddress, companyPublicKey, MASTER_ADDRESS);
//         console.log("liquidityContractAddress: ", liquidityContractAddress);

//         // Deploy RevenueDistributionContract
//         const revenueDistributionContractAddress = await deployRevenueDistributionContract(serviceContractAddress, tokenContractAddress, liquidityContractAddress);
//         console.log("RDContractAddress: ", revenueDistributionContractAddress);

//         // Create a ServiceContract instance
//         const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

//         // Prepare the transaction object
//         const transaction = ServiceContract.methods.setContractAddresses(tokenContractAddress, liquidityContractAddress, revenueDistributionContractAddress);

//         // Call setContractAddresses with gas estimation and send
//         const receipt = await estimateAndSend(transaction, MASTER_ADDRESS, MASTER_PRIVATE_KEY, serviceContractAddress);

//         // Generate DB entry for new tokenization contracts
//         const newContractEntry = new Contract({
//             serviceContractAddress: serviceContractAddress,
//             tokenContractAddress: tokenContractAddress,
//             liquidityContractAddress: liquidityContractAddress,
//             revenueDistributionContractAddress: revenueDistributionContractAddress,
//             assetDIDs: DIDs, // Assuming DIDs is an array of asset DIDs
//             companyId: companyId
//         });

//         // Save the new contract entry to the database
//         await newContractEntry.save();

//         // Respond with the service contract address as the primary reference
//         res.status(200).json({
//             serviceContractAddress: serviceContractAddress, // Primary reference
//             tokenContractAddress: tokenContractAddress,
//             liquidityContractAddress: liquidityContractAddress,
//             revenueDistributionContractAddress: revenueDistributionContractAddress
//         });

//     } catch (error) {
//         console.error('Error deploying Contracts:', error);
//         res.status(500).send('Failed to deploy the contracts.');
//     }
// });

/**
 * @swagger
 * /api/token/deploy:
 *   post:
 *     summary: Tokenize an asset
 *     tags: 
 *       - Token
 *     description: Deploy contracts to tokenize an asset with provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - password
 *               - DIDs
 *               - CIDs
 *               - name
 *               - symbol
 *               - revenueShare
 *               - contractTerm
 *               - maxTokenSupply
 *               - tokenPrice
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: ID of the company initiating tokenization.
 *               password:
 *                 type: string
 *                 description: Password for company authentication.
 *               DIDs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Digital Identifiers.
 *               CIDs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of IPFS Identifiers. 
 *               name:
 *                 type: string
 *                 description: Name of the token.
 *               symbol:
 *                 type: string
 *                 description: Symbol of the token.
 *               revenueShare:
 *                 type: number
 *                 description: Percentage of revenue share.
 *               contractTerm:
 *                 type: number
 *                 description: Term length of the contract.
 *               maxTokenSupply:
 *                 type: number
 *                 description: Maximum supply of the tokens.
 *               tokenPrice:
 *                 type: number
 *                 description: Price of each token.
 *     responses:
 *       200:
 *         description: Successfully tokenized asset and returned contract addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokenContractAddress:
 *                   type: string
 *                 serviceContractAddress:
 *                   type: string
 *                 liquidityContractAddress:
 *                   type: string
 *                 revenueDistributionContractAddress:
 *                   type: string
 *       400:
 *         description: Missing required parameters.
 *       500:
 *         description: Failed to deploy the contracts.
 */


router.post('/token/deploy', async (req, res) => {
    try {
        // Get data from the request
        const { companyId, password, DIDs, CIDs, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice } = req.body;

        if (!companyId || !password || !DIDs || !CIDs || !name || !symbol || !revenueShare || !contractTerm || !maxTokenSupply || !tokenPrice) {
            return res.status(400).send('Missing required parameters.');
        }

        // Step 1: Get the company from the database using the provided companyId
        const company = await Company.findById(companyId);
        if (!company) {
            console.log('Company not found:', companyId);
            return res.status(401).send('Company not found');
        }

        // Step 2: Verify password
        const isPasswordValid = await bcrypt.compare(password, company.password);
        if (!isPasswordValid) {
            console.log('Invalid credentials for company ID:', companyId);
            return res.status(401).send('Invalid credentials');
        }

        console.log("company.ethereumPublicKey: ", company.ethereumPublicKey);
        
        BBWalletAddress =  company.ethereumPublicKey;

        // Deploy the ServiceContract and get its address
        const serviceContractAddress = await deployServiceContract(GSCAddress);

        // Deploy the TokenContract using the ServiceContract's address
        const tokenContractAddress = await deployTokenContract(DIDs, CIDs, [10000], name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress);

        // Deploy LiquidityContract
        const liquidityContractAddress = await deployLiquidityContract(serviceContractAddress, BBWalletAddress, MASTER_ADDRESS);

        // Deploy RevenueDistributionContract
        const revenueDistributionContractAddress = await deployRevenueDistributionContract(serviceContractAddress, tokenContractAddress, liquidityContractAddress);

        // Get SC ABI
        const contractPath = path.join(SCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const SCABI = contractJSON.abi;

        // Create a ServiceContract instance
        const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

        // Prepare the transaction object
        const transaction = ServiceContract.methods.setContractAddresses(tokenContractAddress, liquidityContractAddress, revenueDistributionContractAddress);

        // Call setTokenContract with gas estimation and send
        receipt = await estimateAndSend(transaction, MASTER_ADDRESS, MASTER_PRIVATE_KEY, serviceContractAddress);

        // Generate DB entry for new tokenization contracts
        const newContractEntry = new Contract({
            name:name,
            symbol: symbol,
            serviceContractAddress: serviceContractAddress,
            tokenContractAddress: tokenContractAddress,
            liquidityContractAddress: liquidityContractAddress,
            revenueDistributionContractAddress: revenueDistributionContractAddress,
            assetDIDs: DIDs, // Assuming DIDs is an array of asset DIDs
            companyId: companyId
        });

        // Save the new contract entry to the database
        await newContractEntry.save();

        // Respond with the deployed contracts' addresses
        res.status(200).json({
            tokenContractAddress: tokenContractAddress,
            serviceContractAddress: serviceContractAddress,
            liquidityContractAddress: liquidityContractAddress,
            revenueDistributionContractAddress: revenueDistributionContractAddress,
        });

    } catch (error) {
        console.error('Error deploying Contracts:', error);
        res.status(500).send('Failed to deploy the contracts.');
    }
});


/**
 * @swagger
 * /api/token/{address}:
 *   get:
 *     summary: Retrieve token details by address
 *     tags: 
 *     - Token
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The address of the asset to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved asset details.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error retrieving asset.
 */

router.get('/token/:address', (req, res) => {
    // Retrieve asset details
});

/**
 * @swagger
 * /api/token/{address}:
 *   put:
 *     summary: Update token details by address
 *     tags: 
 *     - Token
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The address of the token to update.
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
 *         description: Successfully updated token details.
 *       404:
 *         description: token not found.
 *       500:
 *         description: Error updating token.
 */

router.put('/token/:address', (req, res) => {
    // Update token details
});

/**
 * @swagger
 * /api/token/{id}:
 *   delete:
 *     summary: Delete token by ID
 *     tags: 
 *     - Token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the token to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted token.
 *       404:
 *         description: token not found.
 *       500:
 *         description: Error deleting token.
 */

router.delete('/token/:address', (req, res) => {
    // Delete token 
});

module.exports = router;