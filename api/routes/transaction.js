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


router.get('/transactions/user/jwt', verifyToken, async (req, res) => {
    try {
        const investorId = req.user.id; // ID is retrieved from the decoded JWT token
        const investor = await Investor.findById(investorId);
        const address = investor.ethereumPublicKey;
        const ownerWalletAddress = address;

        if (!web3.utils.isAddress(address)) {
            return res.status(400).send('Invalid address');
        }

        // Fetch transactions using Subscan API
        const response = await axios.post(`${BLOCKEXPLORER_API_URL}/api/scan/transfers`, {
            row: 100, // Number of records to return
            page: 0, // Page number
            address: address
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': BLOCKEXPLORER_API_KEY
            }
        });

        if (!response.data || !response.data.data || !response.data.data.transfers) {
            return res.status(500).send('Error retrieving transactions');
        }

        const transactions = response.data.data.transfers;

        // Process transactions
        const processedTransactions = transactions.map(tx => {
            // Process each transaction
            // Note: You'll need to map the fields from the Subscan API response to your desired format
            return {
                from: tx.from,
                to: tx.to,
                amount: tx.amount, // Amount may need conversion depending on how Subscan returns it
                timestamp: tx.block_timestamp,
                hash: tx.hash
                // ... other fields you need
            };
        });

        res.status(200).json(processedTransactions);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving transactions');
    }
});

module.exports = router;

module.exports = router;