const express = require('express');
const router = express.Router();
const axios = require('axios');

const app = express();

const CryptoJS = require('crypto-js');
const { ethers } = require('ethers');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config');

const fs = require('fs');
const path = require('path');

const verifyToken = require('../middleware/jwtCheck');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;
const ETHERSCAN_API_URL = process.env.ETHERSCAN_API_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Company = require('../models/CompanyModel');
const Contract = require('../models/TokenModel');
const Investor = require('../models/InvestorModel');
const Token = require('../models/TokenModel');


// /**
//  * @swagger
//  * /api/transactions:
//  *   post:
//  *     summary: Log a new transaction
//  *     tags: 
//  *     - Transaction
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               userId:
//  *                 type: string
//  *               details:
//  *                 type: string
//  *               amount:
//  *                 type: number
//  *               date:
//  *                 type: string
//  *                 format: date-time
//  *     responses:
//  *       200:
//  *         description: Successfully logged transaction.
//  *       500:
//  *         description: Error logging transaction.
//  */
// router.post('/transactions', (req, res) => {
//     // ... your code ...
// });

// /**
//  * @swagger
//  * /api/transactions:
//  *   get:
//  *     summary: Retrieve all transactions
//  *     tags: 
//  *     - Transaction
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved all transactions.
//  *       500:
//  *         description: Error retrieving transactions.
//  */
// router.get('/transactions', (req, res) => {
//     // ... your code ...
// });

// /**
//  * @swagger
//  * /api/transactions/{id}:
//  *   get:
//  *     summary: Retrieve specific transaction by ID
//  *     tags: 
//  *     - Transaction
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         description: The ID of the transaction to retrieve.
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved transaction details.
//  *       404:
//  *         description: Transaction not found.
//  *       500:
//  *         description: Error retrieving transaction.
//  */
// router.get('/transactions/:id', (req, res) => {
//     // ... your code ...
// });


// /**
//  * @swagger
//  * /api/transactions/user/{userId}:
//  *   get:
//  *     summary: Retrieve all transactions for a specific user
//  *     tags: 
//  *     - Transaction
//  *     parameters:
//  *       - in: path
//  *         name: userId
//  *         required: true
//  *         description: The ID of the user whose transactions are to be retrieved.
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved transactions for the user.
//  *       404:
//  *         description: Transactions for user not found.
//  *       500:
//  *         description: Error retrieving transactions for the user.
//  */
// router.get('/transactions/user/:userId', (req, res) => {
//     // ... your code ...
// });

/**
 * @swagger
 * /api/transactions/user/{address}:
 *   get:
 *     summary: Retrieve all Ethereum transactions for a given wallet address
 *     tags: 
 *     - Transaction
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The wallet address for which to retrieve Ethereum transactions.
 *     responses:
 *       200:
 *         description: Successfully retrieved all Ethereum transactions for the wallet address.
 *       404:
 *         description: Wallet address not found or no transactions available.
 *       500:
 *         description: Error retrieving transactions.
 */


router.get('/transactions/user/jwt', verifyToken, async (req, res) => {
    try {
        const investorId = req.user.id; // ID is retrieved from the decoded JWT token
        const investor = await Investor.findById(investorId);
        const address = investor.ethereumPublicKey;
        const ownerWalletAddress = address;

        if (!web3.utils.isAddress(address)) {
            return res.status(400).send('Invalid address');
        }

        // Fetch regular transactions
        const regularTxResponse = await axios.get(`${ETHERSCAN_API_URL}`, {
            params: {
                module: 'account',
                action: 'txlist',
                address: address,
                startblock: 0,
                endblock: 99999999,
                sort: 'asc',
                apikey: ETHERSCAN_API_KEY
            }
        });
        // Fetch token transfer transactions
        const tokenTxResponse = await axios.get(`${ETHERSCAN_API_URL}`, {
            params: {
                module: 'account',
                action: 'tokentx',
                address: address,
                startblock: 0,
                endblock: 99999999,
                sort: 'asc',
                apikey: ETHERSCAN_API_KEY
            }
        });
        // Create a set of hashes from regular transactions for quick lookup
        const regularTxHashes = new Set(regularTxResponse.data.result.map(tx => tx.hash));

        // Create a set of hashes from regular transactions for quick lookup
        const tokenTxHashes = new Set(tokenTxResponse.data.result.map(tx => tx.hash));

        // Filter out token transactions that are already included in regular transactions
        const uniqueTokenTransactions = tokenTxResponse.data.result.filter(tx => !regularTxHashes.has(tx.hash));
        //const uniqueTokenTransactions = regularTxResponse.data.result.filter(tx => !tokenTxHashes.has(tx.hash));

        // Combine and process both types of transactions
        const combinedTransactions = regularTxResponse.data.result.concat(uniqueTokenTransactions);
        //const combinedTransactions = tokenTxResponse.data.result.concat(uniqueTokenTransactions);

        // Sort transactions by date
        combinedTransactions.sort((a, b) => a.timeStamp - b.timeStamp);

        const formattedTransactions = await Promise.all(combinedTransactions.map(async (tx) => {
            let transactionType, tokenAmount, tokenSymbol = null, currency = 'USDC';

            const isUSDC = tx.contractAddress.toLowerCase() === USDCContractAddress.toLowerCase(); // USDC contract address
            console.log("isUSDC: ", isUSDC);
            console.log("tx.contractAddress: ", tx.contractAddress);

            if (tx.methodId === '0x3610724e') {
                transactionType = 'Buy Token';
                tokenAmount = tx.input ? parseInt(tx.input.slice(-64), 16) : null;
                // Query MongoDB for the token symbol
                const tokenData = await Token.findOne({ serviceContractAddress: tx.to });
                tokenSymbol = tokenData ? tokenData.symbol : null;
                currency = isUSDC ? 'USDC' : 'ETH';
            } else if (tx.from.toLowerCase() === ownerWalletAddress.toLowerCase()) {
                transactionType = 'Withdraw';
                currency = isUSDC ? 'USDC' : 'ETH';
            } else if (tx.to.toLowerCase() === ownerWalletAddress.toLowerCase()) {
                transactionType = 'Top up';
                currency = isUSDC ? 'USDC' : 'ETH';
            } else {
                transactionType = 'Unknown';
            }

            return {
                transactionType: transactionType,
                from: tx.from.toLowerCase() === ownerWalletAddress.toLowerCase() ? 'You' : tx.from,
                to: tx.to.toLowerCase() === ownerWalletAddress.toLowerCase() ? 'You' : tx.to,
                payableAmount: web3.utils.fromWei(tx.value, 'ether'),
                tokenAmount: transactionType === "Buy Token" ? web3.utils.fromWei(tokenAmount.toString(), 'ether') : tokenAmount,
                tokenSymbol: tokenSymbol,
                currency: currency,
                date: new Date(tx.timeStamp * 1000).toLocaleString(), // Using toLocaleString() to include time
                hash: tx.hash
            };
        }));

        res.status(200).json(formattedTransactions);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving transactions');
    }
});



module.exports = router;