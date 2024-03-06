//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config_AGNG');

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


const BLOCKEXPLORER_API_URL = process.env.BLOCKEXPLORER_API_URL
const BLOCKEXPLORER_API_KEY = process.env.BLOCKEXPLORER_API_KEY

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
const axios = require('axios');

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

////// FUNCTIONS //////

// Function to get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice();
    console.log(`Current Gas Price: ${gasPrice}`);
    gasPrice = BigInt(gasPrice) * 200n / 100n;
    return gasPrice;
}

// Function to estimate gas and send a transaction
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

// Function to encrypt private key
const encryptPrivateKey = (privateKey, SECRET_KEY) => {
    const encrypted = CryptoJS.AES.encrypt(privateKey, SECRET_KEY).toString();
    return encrypted;
};

// Function to decrypt private key
const decryptPrivateKey = (encryptedKey, SECRET_KEY) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
};

// Function to fetch balance for a given address
async function fetchContractBalance(address) {
    const data = JSON.stringify({ "address": address });
    const config = {
        method: 'post',
        url: `${BLOCKEXPLORER_API_URL}/api/scan/account/tokens`,
        headers: {
            'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
            'Content-Type': 'application/json',
            'X-API-Key': BLOCKEXPLORER_API_KEY
        },
        data: data
    };

    try {
        const response = await axios(config);
        console.log("response: ", response.data.ERC20);
        let agungBalance = '0';
        let usdcBalance = '0';

        // Check if balance arrays exist
        if (response.data.data.native) {
            const nativeBalances = response.data.data.native;
            const agungBalanceWei = nativeBalances.find(token => token.symbol === 'AGUNG')?.balance || '0';
            agungBalance = web3.utils.fromWei(agungBalanceWei, 'ether');
        }
        if (response.data.data.ERC20) {
            const erc20Balances = response.data.data.ERC20;
            const usdcBalanceWei = erc20Balances.find(token => token.contract === USDCContractAddress)?.balance || '0';
            usdcBalance = web3.utils.fromWei(usdcBalanceWei, 'ether');
        }

        return { agungBalance, usdcBalance };
    } catch (error) {
        console.error(`Error fetching balance for address ${address}:`, error);
        return { agungBalance: '0', usdcBalance: '0' };
    }
}


////// DEPLOYMENT SCRIPTS //////

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

////// ROUTES //////

//// For BETA ////

// Create new token
router.post('/token/new', verifyToken, async (req, res) => {
    try {
        const companyId = req.user.id; // Retrieved from the JWT token by verifyToken middleware

        const {
            tokenName,
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


        // Validate the required parameters
        if (!tokenSupply || !tokenPrice || !tokenName || !contractTerm || !revenueShare) {
            return res.status(400).send('Missing required parameters.');
        }

        const company = await Company.findById(companyId);
        if (!company) {
            console.log('Company not found:', companyId);
            return res.status(401).send('Company not found');
        }

        // Define 'tokenSymbol' 
        let tokenSymbol;

        const companyTicker = company.ticker;

        try {
            // Calculate the index by counting the number of tokens with the same companyId
            const tokensWithSameCompanyId = await Token.find({ companyId }).exec();
            const index = tokensWithSameCompanyId.length + 1;

            // Construct 'tokenSymbol'
            tokenSymbol = `${companyTicker}-${index}`;

        } catch (error) {
            console.error('Error counting tokens:', error);
            // Handle the error when counting tokens
        }

        BBWalletAddress = company.ethereumPublicKey;
        maxTokenSupply = tokenSupply;

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
            message: "Successfully created contract draft.",
            newTokenEntry
        });

    } catch (error) {
        console.error('Error creating contract draft:', error);
        res.status(500).send('Failed to create the contract draft.');
    }
});


// Approve token
/**
 * @swagger
 * /token/approve/{tokenId}:
 *   patch:
 *     summary: Approve a token
 *     description: Marks a token as "Approved", indicating the contract is ready for offering to investors. This endpoint updates specific fields of the token's status to "Approved" and sets the message and action needed accordingly.
 *     tags: [Token]
 *     security:
 *       - bearerAuth: []  # Assuming bearer token is used for authorization
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the token to approve.
 *     responses:
 *       200:
 *         description: Token approved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                 updatedToken:
 *                   type: object
 *                   properties:
 *                     statusUpdates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           messages:
 *                             type: array
 *                             items:
 *                               type: string
 *                           actionsNeeded:
 *                             type: array
 *                             items:
 *                               type: string
 *       404:
 *         description: Token not found.
 *       500:
 *         description: Failed to approve the token.
 */
router.patch('/token/approve/:tokenId', verifyToken, async (req, res) => {
    const { tokenId } = req.params; // Token ID sent in the request URL

    try {
        // Update the specific fields of the token
        const updatedToken = await Token.findByIdAndUpdate(
            tokenId,
            {
                $set: {
                    "statusUpdates": [{
                        status: 'Approved',
                        messages: ["Your contract is ready for offering to investors."],
                        actionsNeeded: ["Whenever you are ready, click on \"Offer Contract\"."]
                    }]
                }
            },
            { new: true } // Return the updated document
        );

        if (!updatedToken) {
            return res.status(404).send('Token not found.');
        }

        // Respond with the updated token information
        res.status(200).json({
            message: "Token approved successfully.",
            updatedToken
        });

    } catch (error) {
        console.error('Error approving the token:', error);
        res.status(500).send('Failed to approve the token.');
    }
});


// Decline token
/**
 * @swagger
 * /token/decline/{tokenId}:
 *   patch:
 *     summary: Decline a token
 *     description: Marks a token as "Declined" and provides reasons or next steps. This endpoint updates specific fields of the token's status to "Declined" and includes a message for the user about what actions are needed next or the reasons for decline.
 *     tags: [Token]
 *     security:
 *       - bearerAuth: []  # Assuming bearer token is used for authorization
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the token to decline.
 *     responses:
 *       200:
 *         description: Token declined successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                 updatedToken:
 *                   type: object
 *                   properties:
 *                     statusUpdates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           messages:
 *                             type: array
 *                             items:
 *                               type: string
 *                           actionsNeeded:
 *                             type: array
 *                             items:
 *                               type: string
 *       404:
 *         description: Token not found.
 *       500:
 *         description: Failed to decline the token.
 */
router.patch('/token/decline/:tokenId', verifyToken, async (req, res) => {
    const { tokenId } = req.params; // Token ID sent in the request URL

    try {
        // Update the specific fields of the token to indicate it has been declined
        const updatedToken = await Token.findByIdAndUpdate(
            tokenId,
            {
                $set: {
                    "statusUpdates": [{
                        status: 'Declined',
                        messages: ["Your contract draft has been declined."],
                        actionsNeeded: ["Review the feedback and submit for approval again."]
                    }]
                }
            },
            { new: true } // Return the updated document
        );

        if (!updatedToken) {
            return res.status(404).send('Token not found.');
        }

        // Respond with the updated token information
        res.status(200).json({
            message: "Token declined successfully.",
            updatedToken
        });

    } catch (error) {
        console.error('Error declining the token:', error);
        res.status(500).send('Failed to decline the token.');
    }
});


// Request documents for token
/**
 * @swagger
 * /token/requestDocs/{tokenId}:
 *   patch:
 *     summary: Request documents for a token
 *     description: Updates the token's status to indicate that documents have been requested from the token issuer, including a message and action needed.
 *     tags: [Token]
 *     security:
 *       - bearerAuth: []  # Assuming bearer token is used for authorization
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the token for which documents are being requested.
 *     responses:
 *       200:
 *         description: Documents requested successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                 updatedToken:
 *                   type: object
 *                   properties:
 *                     statusUpdates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           messages:
 *                             type: array
 *                             items:
 *                               type: string
 *                           actionsNeeded:
 *                             type: array
 *                             items:
 *                               type: string
 *       404:
 *         description: Token not found.
 *       500:
 *         description: Failed to request documents for the token.
 */
router.patch('/token/requestDocs/:tokenId', verifyToken, async (req, res) => {
    const { tokenId } = req.params; // Token ID sent in the request URL

    try {
        // Update the token to reflect that documents have been requested
        const updatedToken = await Token.findByIdAndUpdate(
            tokenId,
            {
                $set: {
                    "statusUpdates": [{
                        status: 'Documents Requested',
                        messages: ["Please submit the required documents for your token."],
                        actionsNeeded: ["Upload documents via the provided link."]
                    }]
                }
            },
            { new: true } // Return the updated document
        );

        if (!updatedToken) {
            return res.status(404).send('Token not found.');
        }

        // Respond with the updated token information
        res.status(200).json({
            message: "Documents requested successfully.",
            updatedToken
        });

    } catch (error) {
        console.error('Error requesting documents for the token:', error);
        res.status(500).send('Failed to request documents for the token.');
    }
});


// Generic token status update
/**
 * @swagger
 * /token/status/{tokenId}:
 *   patch:
 *     summary: Update the status of a token
 *     description: Updates a token's status, including messages and actions needed by the token issuer. Allows for a generic update to any token's status details.
 *     tags: [Token]
 *     security:
 *       - bearerAuth: []  # Assuming bearer token is used for authorization
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the token to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status for the token.
 *               messages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional messages related to the status update.
 *               actionsNeeded:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional actions required from the token issuer.
 *     responses:
 *       200:
 *         description: Token status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                 updatedToken:
 *                   type: object
 *                   properties:
 *                     statusUpdates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           messages:
 *                             type: array
 *                             items:
 *                               type: string
 *                           actionsNeeded:
 *                             type: array
 *                             items:
 *                               type: string
 *       404:
 *         description: Token not found.
 *       500:
 *         description: Failed to update token status.
 */
router.patch('/token/status/:tokenId', verifyToken, async (req, res) => {
    const { tokenId } = req.params; // Token ID sent in the request URL
    const { status, messages, actionsNeeded } = req.body; // Expected fields in the request body

    // Validate the required parameters
    if (!status) {
        return res.status(400).send('Status is required.');
    }

    try {
        // Update the token with the new status, messages, and actionsNeeded
        const updatedToken = await Token.findByIdAndUpdate(
            tokenId,
            {
                $set: {
                    "statusUpdates": [{ status, messages, actionsNeeded }]
                }
            },
            { new: true } // Return the updated document
        );

        if (!updatedToken) {
            return res.status(404).send('Token not found.');
        }

        // Respond with the updated token information
        res.status(200).json({
            message: "Token status updated successfully.",
            updatedToken
        });

    } catch (error) {
        console.error('Error updating token status:', error);
        res.status(500).send('Failed to update token status.');
    }
});


// Deploy token 
/**
 * @swagger
 * /api/token/deploy:
 *   post:
 *     summary: Deploys tokenization contracts based on a token's specifications and updates its status in the system.
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
 *               - tokenId
 *             properties:
 *               tokenId:
 *                 type: string
 *                 description: The unique identifier of the token to deploy.
 *     responses:
 *       200:
 *         description: Successfully deployed tokenization contracts and updated the token's status and symbol.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   $ref: '#/components/schemas/Token'
 *       400:
 *         description: Invalid Token ID.
 *       404:
 *         description: Token not found or Company not found for this token.
 *       500:
 *         description: Failed to deploy the contracts.
 */
router.post('/token/deploy', verifyToken, async (req, res) => {
    const { tokenId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
        return res.status(400).send('Invalid Token ID.');
    }

    try {
        const token = await Token.findById(tokenId);
        if (!token) {
            return res.status(404).send('Token not found.');
        }

        const company = await Company.findById(token.companyId);
        if (!company) {
            return res.status(404).send('Company not found for this token.');
        }

        // Determine the tokenSymbol
        const tokens = await Token.find({ companyId: company._id });
        const tokenSymbol = `${company.ticker}-${tokens.length + 1}`;

        // Deploy contracts and update token details
        // Assuming deployContracts is an async function that returns the contract addresses
        const { serviceContractAddress, tokenContractAddress, liquidityContractAddress, revenueDistributionContractAddress } = await deployContracts(token, tokenSymbol);

        token.serviceContractAddress = serviceContractAddress;
        token.tokenContractAddress = tokenContractAddress;
        token.liquidityContractAddress = liquidityContractAddress;
        token.revenueDistributionContractAddress = revenueDistributionContractAddress;
        token.symbol = tokenSymbol; // Update the symbol with the new one
        token.statusUpdates.push({
            status: 'Deployed',
            messages: ["Your token contract has been deployed and is now visible on the marketplace."],
            actionsNeeded: ["No actions needed."]
        });

        await token.save();

        res.status(200).json({
            message: "Successfully deployed tokenization contracts.",
            token
        });

    } catch (error) {
        console.error('Error during token deployment:', error);
        res.status(500).send('Failed to deploy the contracts.');
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
// Get all tokens along with associated company and asset objects
router.get('/token/all', async (req, res) => {
    try {
        const tokens = await Token.find({})
            .populate('companyId')
            .populate('assetIds');

        const updatedTokens = await Promise.all(tokens.map(async token => {
            const fundingCurrent = (await fetchContractBalance(token.liquidityContractAddress)).usdcBalance;

            const tokenContract = new web3.eth.Contract(TCABI, token.tokenContractAddress);
            const tokenContractBalance = await tokenContract.methods.balanceOf(token.tokenContractAddress).call();

            // Return a new object with updated properties
            return {
                ...token.toObject(),
                fundingCurrent,
                tokenContractBalance,
            };
        }));

        res.status(200).json(updatedTokens);
    } catch (error) {
        console.error('Error retrieving tokens:', error);
        res.status(500).send('Error retrieving tokens.');
    }
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
// Delete token
router.delete('/token/:address', (req, res) => {
    // Delete token 
});


//// For production ////

// /**
//  * @swagger
//  * /api/token/jwt:
//  *   get:
//  *     summary: Retrieve token holdings for the current authenticated investor
//  *     tags:
//  *       - Token
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Token holdings of the investor.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   tokenName:
//  *                     type: string
//  *                   symbol:
//  *                     type: string
//  *                   balance:
//  *                     type: string
//  *       401:
//  *         description: Unauthorized, token required.
//  *       404:
//  *         description: Investor not found.
//  *       500:
//  *         description: An error occurred while retrieving token holdings.
//  */
// // Get token holdings from investor
// router.get('/token/', verifyToken, async (req, res) => {
//     const investorId = req.user.id;

//     try {
//         // Fetch the investor's public key from the database
//         const investor = await Investor.findById(investorId);
//         if (!investor) {
//             return res.status(404).send('Investor not found');
//         }

//         const publicKey = investor.ethereumPublicKey;

//         // Fetch all tokens from the database
//         const tokens = await Token.find({});

//         // Iterate over the tokens to get the balance for the investor's public key
//         let investorTokenHoldings = [];
//         for (let token of tokens) {
//             const tokenContract = new web3.eth.Contract(TCABI, token.tokenContractAddress);
//             const balance = await tokenContract.methods.balanceOf(publicKey).call();

//             // Convert the balance from Wei to Ether and check if it's greater than 0
//             const balanceInEth = web3.utils.fromWei(balance, 'ether');
//             if (parseFloat(balanceInEth) > 0) {
//                 investorTokenHoldings.push({
//                     name: token.name,
//                     symbol: token.symbol,
//                     tokenContractAddress: token.tokenContractAddress,
//                     contractTerm: token.contractTerm,
//                     tokenPrice: token.tokenPrice,
//                     currency: token.currency,
//                     maxTokenSupply: token.maxTokenSupply,
//                     balance: balanceInEth // balance already converted to Ether
//                 });
//             }
//         }

//         res.json(investorTokenHoldings);
//     } catch (error) {
//         console.error('Error fetching token holdings:', error);
//         res.status(500).send('Error fetching token holdings');
//     }
// });

// /**
//  * @swagger
//  * /api/token/status/{tokenId}:
//  *   patch:
//  *     summary: Update the status of a token object.
//  *     tags:
//  *       - Token
//  *     description: Update the status, messages, and actions needed for a token.
//  *     parameters:
//  *       - in: path
//  *         name: tokenId
//  *         required: true
//  *         description: The ID of the token to update.
//  *         schema:
//  *           type: string
//  *       - in: body
//  *         name: tokenUpdate
//  *         required: true
//  *         description: The token status update object.
//  *         schema:
//  *           type: object
//  *           required:
//  *             - status
//  *           properties:
//  *             status:
//  *               type: string
//  *               description: The new status value for the token (pending, approved, denied, action needed).
//  *             messages:
//  *               type: array
//  *               description: An array of messages associated with the token status.
//  *               items:
//  *                 type: string
//  *             actionsNeeded:
//  *               type: array
//  *               description: An array of actions needed for the token.
//  *               items:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Token status updated successfully.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   description: A success message.
//  *                 updatedToken:
//  *                   $ref: '#/components/schemas/Token'
//  *       400:
//  *         description: Invalid status value.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   description: An error message.
//  *       404:
//  *         description: Token not found.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   description: An error message.
//  *       500:
//  *         description: An error occurred while updating token status.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   description: An error message.
//  * components:
//  *   schemas:
//  *     Token:
//  *       type: object
//  *       required:
//  *         - name
//  *         - symbol
//  *         - serviceContractAddress
//  *         - tokenContractAddress
//  *         - liquidityContractAddress
//  *         - revenueDistributionContractAddress
//  *         - companyId
//  *       properties:
//  *         name:
//  *           type: string
//  *           description: Name of the token.
//  *         symbol:
//  *           type: string
//  *           description: Symbol of the token.
//  *         serviceContractAddress:
//  *           type: string
//  *           description: Blockchain address of the service contract.
//  *         tokenContractAddress:
//  *           type: string
//  *           description: Blockchain address of the token contract.
//  *         liquidityContractAddress:
//  *           type: string
//  *           description: Blockchain address of the liquidity contract.
//  *         revenueDistributionContractAddress:
//  *           type: string
//  *           description: Blockchain address of the revenue distribution contract.
//  *         companyId:
//  *           type: string
//  *           description: ID of the company that owns the token.
//  */
// // Confirm received funds from investor
// router.patch('/token/status/:tokenId', async (req, res) => {
//     try {
//         const { status, messages, actionsNeeded } = req.body;
//         const { tokenId } = req.params;

//         // Optional: Validate the status and ensure it's one of the allowed values
//         const validStatuses = ["pending", "approved", "denied", "action needed",];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).send('Invalid status value.');
//         }

//         // Find the token by ID and update its status
//         const updatedToken = await Token.findByIdAndUpdate(
//             tokenId,
//             {
//                 $set: {
//                     status: status,
//                     messages: messages, // Assuming messages is an array of strings
//                     actionsNeeded: actionsNeeded // Assuming actionsNeeded is an array of strings
//                 }
//             },
//             { new: true } // Return the updated document
//         );

//         if (!updatedToken) {
//             return res.status(404).send('Token not found.');
//         }

//         // Respond with the updated token details
//         res.status(200).json({
//             message: "Token status updated successfully.",
//             updatedToken
//         });

//     } catch (error) {
//         console.error('Error updating token status:', error);
//         res.status(500).send('Error updating token status.');
//     }
// });

//// For later version ////


//// To delete ////

// /**
//  * @swagger
//  * /api/token/{address}:
//  *   get:
//  *     summary: Retrieve token details by address
//  *     tags: 
//  *     - Token
//  *     parameters:
//  *       - in: path
//  *         name: address
//  *         required: true
//  *         description: The address of the asset to retrieve.
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved asset details.
//  *       404:
//  *         description: Asset not found.
//  *       500:
//  *         description: Error retrieving asset.
//  */
// // Get token details by address [delete]
// router.get('/token/:address', async (req, res) => {
//     try {
//         const { address } = req.params;
//         const token = await Token.findOne({ tokenContractAddress: address });

//         if (!token) {
//             return res.status(404).send('Token contract not found.');
//         }

//         // Respond with the token contract data
//         res.status(200).json(token);
//     } catch (error) {
//         console.error('Error retrieving token contract:', error);
//         res.status(500).send('Error retrieving token contract.');
//     }
// });

module.exports = router;