const express = require('express');
const router = express.Router();
const axios = require('axios');

const app = express();

const CryptoJS = require('crypto-js');
const { ethers } = require('ethers');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config_AGNG');

const fs = require('fs');
const path = require('path');

const verifyToken = require('../middleware/jwtCheck');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;
const BLOCKEXPLORER_API_URL = process.env.BLOCKEXPLORER_API_URL
const BLOCKEXPLORER_API_KEY = process.env.BLOCKEXPLORER_API_KEY

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Company = require('../models/CompanyModel');
const Contract = require('../models/TokenModel');
const Investor = require('../models/InvestorModel');
const Token = require('../models/TokenModel');
const Transaction = require('../models/TransactionModel');


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
router.get('/transactions/user/:address', async (req, res) => {
    try {
        const { address } = req.params;

        if (!web3.utils.isAddress(address)) {
            return res.status(400).send('Invalid address');
        }

        var data = JSON.stringify({ "address": address, "row": 100 });

        const config_tx = {
            method: 'post',
            url: `${BLOCKEXPLORER_API_URL}/api/scan/evm/v2/transactions`,
            headers: {
                'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
                'Content-Type': 'application/json',
                'X-API-Key': BLOCKEXPLORER_API_KEY
            },
            data: data
        };
        const regularTxResponse = await axios(config_tx);

        const config_token_transfers = {
            method: 'post',
            url: `${BLOCKEXPLORER_API_URL}/api/scan/evm/token/transfer`,
            headers: {
                'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
                'Content-Type': 'application/json',
                'X-API-Key': BLOCKEXPLORER_API_KEY
            },
            data: data
        };
        const tokenTxResponse = await axios(config_token_transfers);

        // Adjusted to access the correct nested list structure
        const regularTxList = regularTxResponse.data.data.list;
        const tokenTxList = tokenTxResponse.data.data.list;

        // FOR DEBUGGING
        // console.log("regularTxList: ", regularTxList);
        // console.log("tokenTxList: ", tokenTxList);

        // TODO: DEBUG RegularTxList
        // Ensure both lists are arrays
        //const safeRegularTxList = regularTxList || [];
        const safeRegularTxList = [];
        const safeTokenTxList = tokenTxList || [];

        // Create a set of hashes from regular transactions for quick lookup
        const regularTxHashes = new Set(safeRegularTxList.map(tx => tx.hash));

        // Filter out token transactions that are already included in regular transactions
        const uniqueTokenTransactions = safeTokenTxList.filter(tx => !regularTxHashes.has(tx.hash));

        // Combine and process both types of transactions
        const combinedTransactions = safeRegularTxList.concat(uniqueTokenTransactions);

        // Sort transactions by date in descending order (most recent first)
        combinedTransactions.sort((a, b) => b.block_timestamp - a.block_timestamp);

        const formattedTransactions = await Promise.all(combinedTransactions.map(async (tx) => {
            let transactionType, tokenAmount, tokenSymbol = null, currency = 'AGUNG';

            const isUSDC = tx.contract === USDCContractAddress; // USDC contract address
            date = isUSDC ? new Date(tx.create_at * 1000).toLocaleString() : new Date(tx.block_timestamp * 1000).toLocaleString();
            
            const toServiceContract = await Token.findOne({ serviceContractAddress: tx.to });
            const fromTokenContract = await Token.findOne({ tokenContractAddress: tx.from });
        
            if (tx.methodId === '0x3610724e' || toServiceContract || fromTokenContract) {
                transactionType = 'Buy Token';
                // tokenAmount = tx.value ? parseInt(tx.value.slice(-64), 16) : null;
                tokenSymbol = (toServiceContract || fromTokenContract) ? (toServiceContract || fromTokenContract).symbol : null;
                currency = isUSDC ? 'USDC' : fromTokenContract.symbol;
            } else if (tx.from.toLowerCase() === address.toLowerCase()) {
                transactionType = 'Withdraw';
                currency = isUSDC ? 'USDC' : 'AGUNG';
            } else if (tx.to.toLowerCase() === address.toLowerCase()) {
                transactionType = 'Top up';
                currency = isUSDC ? 'USDC' : 'AGUNG';
            } else {
                transactionType = 'Unknown';
            }

            return {
                transactionType: transactionType,
                from: tx.from.toLowerCase() === address.toLowerCase() ? 'You' : tx.from,
                to: tx.to.toLowerCase() === address.toLowerCase() ? 'You' : tx.to,
                payableAmount: web3.utils.fromWei(tx.value, 'ether'),
                tokenAmount: tokenAmount,
                tokenSymbol: tokenSymbol,
                currency: currency,
                date: date,
                hash: tx.hash
            };
        })).then(transactions => transactions.filter(tx => tx.transactionType !== 'Unknown')); // Filter out 'Unknown' transactions

        // FOR DEBUGGING
        // console.log("formattedTransactions: ", formattedTransactions);

        res.status(200).json(formattedTransactions);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving transactions');
    }
});

/**
 * @swagger
 * /api/transactions/liquidityContract/{address}:
 *   get:
 *     summary: Retrieve all Ethereum transactions for a given liquidityContract address
 *     tags: 
 *     - Transaction
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The liquidityContract address for which to retrieve Ethereum transactions.
 *     responses:
 *       200:
 *         description: Successfully retrieved all Ethereum transactions for the liquidityContract address.
 *       404:
 *         description: liquidityContract address not found or no transactions available.
 *       500:
 *         description: Error retrieving transactions.
 */
router.get('/transactions/liquidityContract/:address', async (req, res) => {
    try {
        const { address } = req.params;

        if (!web3.utils.isAddress(address)) {
            return res.status(400).send('Invalid address');
        }

        var data = JSON.stringify({ "address": address, "row": 100 });

        const config_tx = {
            method: 'post',
            url: `${BLOCKEXPLORER_API_URL}/api/scan/evm/v2/transactions`,
            headers: {
                'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
                'Content-Type': 'application/json',
                'X-API-Key': BLOCKEXPLORER_API_KEY
            },
            data: data
        };
        const regularTxResponse = await axios(config_tx);

        const config_token_transfers = {
            method: 'post',
            url: `${BLOCKEXPLORER_API_URL}/api/scan/evm/token/transfer`,
            headers: {
                'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
                'Content-Type': 'application/json',
                'X-API-Key': BLOCKEXPLORER_API_KEY
            },
            data: data
        };
        const tokenTxResponse = await axios(config_token_transfers);

        // Adjusted to access the correct nested list structure
        const regularTxList = regularTxResponse.data.data.list;
        const tokenTxList = tokenTxResponse.data.data.list;

        // FOR DEBUGGING
        // console.log("regularTxList: ", regularTxList);
        // console.log("tokenTxList: ", tokenTxList);

        // TODO: DEBUG RegularTxList
        // Ensure both lists are arrays
        //const safeRegularTxList = regularTxList || [];
        const safeRegularTxList = [];
        const safeTokenTxList = tokenTxList || [];

        // Create a set of hashes from regular transactions for quick lookup
        const regularTxHashes = new Set(safeRegularTxList.map(tx => tx.hash));

        // Filter out token transactions that are already included in regular transactions
        const uniqueTokenTransactions = safeTokenTxList.filter(tx => !regularTxHashes.has(tx.hash));

        // Combine and process both types of transactions
        const combinedTransactions = safeRegularTxList.concat(uniqueTokenTransactions);

        // Sort transactions by date in descending order (most recent first)
        combinedTransactions.sort((a, b) => b.block_timestamp - a.block_timestamp);

        const formattedTransactions = await Promise.all(combinedTransactions.map(async (tx) => {
            let transactionType, tokenAmount, tokenSymbol = null, currency = 'AGUNG';

            const isUSDC = tx.contract === USDCContractAddress; // USDC contract address
            date = isUSDC ? new Date(tx.create_at * 1000).toLocaleString() : new Date(tx.block_timestamp * 1000).toLocaleString();
            
            const fromServiceContract = await Token.findOne({ serviceContractAddress: tx.from });
            const fromTokenContract = await Token.findOne({ tokenContractAddress: tx.from });
        
            if (tx.methodId === '0x3610724e' || fromTokenContract) {
                transactionType = 'Buy Token';
                // tokenAmount = tx.value ? parseInt(tx.value.slice(-64), 16) : null;
                tokenSymbol = (fromTokenContract) ? (fromTokenContract).symbol : null;
                currency = isUSDC ? 'USDC' : fromTokenContract.symbol;
            } else if (tx.from.toLowerCase() === address.toLowerCase()) {
                transactionType = 'Withdraw';
                currency = isUSDC ? 'USDC' : 'AGUNG';
            } else if (tx.to.toLowerCase() === address.toLowerCase() && fromServiceContract ) {
                transactionType = 'Token Purchase';
                currency = isUSDC ? 'USDC' : 'AGUNG';
                tokenSymbol = fromServiceContract.name
            } else {
                transactionType = 'Unknown';
            }

            return {
                transactionType: transactionType,
                from: tx.from.toLowerCase() === address.toLowerCase() ? 'You' : tx.from,
                to: tx.to.toLowerCase() === address.toLowerCase() ? 'You' : tx.to,
                payableAmount: web3.utils.fromWei(tx.value, 'ether'),
                tokenAmount: tokenAmount,
                project: tokenSymbol,
                currency: currency,
                date: date,
                hash: tx.hash
            };
        })).then(transactions => transactions.filter(tx => tx.transactionType !== 'Unknown')); // Filter out 'Unknown' transactions

        // FOR DEBUGGING
        // console.log("formattedTransactions: ", formattedTransactions);

        res.status(200).json(formattedTransactions);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving transactions');
    }
});


module.exports = router;