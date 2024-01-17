//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress, USDCAddress } = require('../config/web3Config_AGNG');

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
const USDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'USDCContract.sol', 'USDCContract.json');



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
// Get USDC ABI
const USDCContractPath = path.join(USDCBuild);
const USDCContractJSON = JSON.parse(fs.readFileSync(USDCContractPath, 'utf8'));
const USDCABI = USDCContractJSON.abi;

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const verifyToken = require('../middleware/jwtCheck');

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
const Token = require('../models/TokenModel');
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
async function deployTokenContract(DIDs, CIDs, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, currency, serviceContractAddress) {
    const contractPath = path.join(TCBuild);
    const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const TokenContract = new web3.eth.Contract(contractJSON.abi);

    const constructorArgs = {
        penomoWallet: MASTER_ADDRESS,
        globalStateAddress: GSCAddress,
        serviceContractAddress: serviceContractAddress,
        name: name,
        symbol: symbol,
        revenueShare: revenueShare * 10000,
        maxTokenSupply: web3.utils.toWei(maxTokenSupply.toString(), 'ether'),
        tokenPrice: web3.utils.toWei(tokenPrice.toString(), 'ether'),
        currency: currency,
    };

    // DEBUG
    console.log("constructorArgs:", constructorArgs);

    const deploymentData = TokenContract.deploy({
        data: contractJSON.bytecode,
        // DEBUG: Include DIDs and CIDs
        //arguments: [constructorArgs, DIDs, CIDs, []]
        arguments: [constructorArgs, [], [], []]
    });

    // DEBUG
    console.log("deploymentData:", deploymentData);

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

// // TOKEN ROUTES

/**
 * @swagger
 * /api/token/deploy:
 *   post:
 *     summary: Deploys tokenization contracts and registers a new token in the system.
 *     tags:
 *       - Token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenName
 *               - tokenSymbol
 *               - tokenSupply
 *               - tokenPrice
 *               - paymentCurrency
 *               - contractTerm
 *               - revenueShare
 *               - DIDs
 *             properties:
 *               tokenName:
 *                 type: string
 *               tokenSymbol:
 *                 type: string
 *               tokenSupply:
 *                 type: number
 *               tokenPrice:
 *                 type: number
 *               paymentCurrency:
 *                 type: string
 *               contractTerm:
 *                 type: number
 *               revenueShare:
 *                 type: number
 *               DIDs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successfully deployed tokenization contracts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newTokenEntry:
 *                   $ref: '#/components/schemas/Token'
 *       400:
 *         description: Missing required parameters.
 *       401:
 *         description: Unauthorized. Company not found or invalid credentials.
 *       500:
 *         description: Failed to deploy the contracts.
 */


router.post('/token/deploy', verifyToken, async (req, res) => {
    try {
        const companyId = req.user.id; // Retrieved from the JWT token by verifyToken middleware

        const {
            tokenName,
            tokenSymbol,
            tokenSupply,
            tokenPrice,
            paymentCurrency,
            contractTerm,
            revenueShare,
            assetIds,
            assetValue,
            revenueStreams,
            fundingGoal,
            fundingUsage,
            projectDescription
        } = req.body;

        console.log("/token/deploy req.body: ", req.body); 

        // Validate the required parameters
        if (!tokenSupply || !tokenPrice || !tokenName || !contractTerm || !revenueShare) {
            return res.status(400).send('Missing required parameters.');
        }

        const company = await Company.findById(companyId);
        if (!company) {
            console.log('Company not found:', companyId);
            return res.status(401).send('Company not found');
        }
        console.log("company.ethereumPublicKey: ", company.ethereumPublicKey);

        BBWalletAddress = company.ethereumPublicKey;
        maxTokenSupply = tokenSupply;

        // Deploy the ServiceContract and get its address
        const serviceContractAddress = await deployServiceContract(GSCAddress);
        console.log("serviceContractAddress:", serviceContractAddress);


        // Deploy the TokenContract using the ServiceContract's address
        // TODO: Implement DID & CID handling (Datastorage on IPFS)
        const tokenContractAddress = await deployTokenContract([], [], tokenName, tokenSymbol, revenueShare, contractTerm, tokenSupply, tokenPrice, paymentCurrency, serviceContractAddress);
        console.log("tokenContractAddress:", tokenContractAddress);


        // Deploy LiquidityContract
        const liquidityContractAddress = await deployLiquidityContract(serviceContractAddress, BBWalletAddress, MASTER_ADDRESS);
        console.log("liquidityContractAddress:", liquidityContractAddress);

        // Deploy RevenueDistributionContract
        const revenueDistributionContractAddress = await deployRevenueDistributionContract(serviceContractAddress, tokenContractAddress, liquidityContractAddress);
        console.log("revenueDistributionContractAddress:", revenueDistributionContractAddress);

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
        const newTokenEntry = new Token({
            name: tokenName,
            symbol: tokenSymbol,
            maxTokenSupply: tokenSupply,
            tokenPrice: tokenPrice,
            currency: paymentCurrency,
            revenueShare: revenueShare,
            contractTerm: contractTerm,
            assetValue: assetValue,
            revenueStreams: revenueStreams,
            fundingGoal: fundingGoal,
            fundingCurrent: 0,
            fundingUsage: fundingUsage,
            projectDescription: projectDescription,
            serviceContractAddress: serviceContractAddress,
            tokenContractAddress: tokenContractAddress,
            liquidityContractAddress: liquidityContractAddress,
            revenueDistributionContractAddress: revenueDistributionContractAddress,
            revenueStreamContractAddresses: [],
            assetIds: assetIds,
            companyId: companyId,
            statusUpdates: [{
                status: 'Pending',
                messages: ["Your submitted documents are currently under review. We will notify you via mail with updates."],
                actionsNeeded: ["No actions needed for now."]
            }]
        });

        // Save the new token entry to the database
        await newTokenEntry.save();

        // Respond with the deployed contracts' addresses
        res.status(200).json({
            message: "Successfully deployed tokenization contracts.",
            newTokenEntry
        });

    } catch (error) {
        console.error('Error deploying Contracts:', error);
        res.status(500).send('Failed to deploy the contracts.');
    }
});

// PATCH endpoint to update the status of the token object
router.patch('/token/status/:tokenId', async (req, res) => {
    try {
        const { status, messages, actionsNeeded } = req.body;
        const { tokenId } = req.params;

        // Optional: Validate the status and ensure it's one of the allowed values
        const validStatuses = ["pending", "approved", "denied", "action needed",];
        if (!validStatuses.includes(status)) {
            return res.status(400).send('Invalid status value.');
        }

        // Find the token by ID and update its status
        const updatedToken = await Token.findByIdAndUpdate(
            tokenId,
            {
                $set: {
                    status: status,
                    messages: messages, // Assuming messages is an array of strings
                    actionsNeeded: actionsNeeded // Assuming actionsNeeded is an array of strings
                }
            },
            { new: true } // Return the updated document
        );

        if (!updatedToken) {
            return res.status(404).send('Token not found.');
        }

        // Respond with the updated token details
        res.status(200).json({
            message: "Token status updated successfully.",
            updatedToken
        });

    } catch (error) {
        console.error('Error updating token status:', error);
        res.status(500).send('Error updating token status.');
    }
});


/**
 * @swagger
 * /api/token/all:
 *   get:
 *     summary: Retrieve a list of all tokens
 *     tags:
 *       - Token
 *     description: Retrieve a list of all token objects from the database.
 *     responses:
 *       200:
 *         description: A list of tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Token'
 *       500:
 *         description: An error occurred while retrieving tokens.
 * components:
 *   schemas:
 *     Token:
 *       type: object
 *       required:
 *         - name
 *         - symbol
 *         - serviceContractAddress
 *         - tokenContractAddress
 *         - liquidityContractAddress
 *         - revenueDistributionContractAddress
 *         - companyId
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the token.
 *         symbol:
 *           type: string
 *           description: Symbol of the token.
 *         serviceContractAddress:
 *           type: string
 *           description: Blockchain address of the service contract.
 *         tokenContractAddress:
 *           type: string
 *           description: Blockchain address of the token contract.
 *         liquidityContractAddress:
 *           type: string
 *           description: Blockchain address of the liquidity contract.
 *         revenueDistributionContractAddress:
 *           type: string
 *           description: Blockchain address of the revenue distribution contract.
 *         companyId:
 *           type: string
 *           description: ID of the company that owns the token.
 */
// Get all tokens
router.get('/token/all', async (req, res) => {
    try {
        // Assuming Token is your Mongoose model for the token contracts
        const tokens = await Token.find({});

        // Respond with an array of all token contracts
        res.status(200).json(tokens);
    } catch (error) {
        console.error('Error retrieving tokens:', error);
        res.status(500).send('Error retrieving tokens.');
    }
});

/**
 * @swagger
 * /api/token/jwt:
 *   get:
 *     summary: Retrieve token holdings for the current authenticated investor
 *     tags:
 *       - Token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token holdings of the investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tokenName:
 *                     type: string
 *                   symbol:
 *                     type: string
 *                   balance:
 *                     type: string
 *       401:
 *         description: Unauthorized, token required.
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: An error occurred while retrieving token holdings.
 */
// Get token holdings from logged in investor
router.get('/token/jwt', verifyToken, async (req, res) => {
    const investorId = req.user.id;

    try {
        // Fetch the investor's public key from the database
        const investor = await Investor.findById(investorId);
        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        const publicKey = investor.ethereumPublicKey;

        // Fetch all tokens from the database
        const tokens = await Token.find({});

        // Iterate over the tokens to get the balance for the investor's public key
        let investorTokenHoldings = [];
        for (let token of tokens) {
            const tokenContract = new web3.eth.Contract(TCABI, token.tokenContractAddress);
            const balance = await tokenContract.methods.balanceOf(publicKey).call();

            // Convert the balance from Wei to Ether and check if it's greater than 0
            const balanceInEth = web3.utils.fromWei(balance, 'ether');
            if (parseFloat(balanceInEth) > 0) {
                investorTokenHoldings.push({
                    name: token.name,
                    symbol: token.symbol,
                    tokenContractAddress: token.tokenContractAddress,
                    contractTerm: token.contractTerm,
                    tokenPrice: token.tokenPrice,
                    currency: token.currency,
                    maxTokenSupply: token.maxTokenSupply,
                    balance: balanceInEth // balance already converted to Ether
                });
            }
        }

        res.json(investorTokenHoldings);
    } catch (error) {
        console.error('Error fetching token holdings:', error);
        res.status(500).send('Error fetching token holdings');
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

router.get('/token/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const token = await Token.findOne({ tokenContractAddress: address });

        if (!token) {
            return res.status(404).send('Token contract not found.');
        }

        // Respond with the token contract data
        res.status(200).json(token);
    } catch (error) {
        console.error('Error retrieving token contract:', error);
        res.status(500).send('Error retrieving token contract.');
    }
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
 * /api/token/{address}:
 *   delete:
 *     summary: Delete token by address
 *     tags: 
 *     - Token
 *     parameters:
 *       - in: path
 *         name: tokenContractAddress
 *         required: true
 *         description: The address of the token to delete.
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