const express = require('express');
const router = express.Router();
const axios = require('axios');

const app = express();

const CryptoJS = require('crypto-js');
const { ethers } = require('ethers');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config');

const fs = require('fs');
const path = require('path');

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
const Token = require('./path_to_your_token_model'); // Import your Token model

router.get('/transactions/user/:address', async (req, res) => {
    try {
        const address = req.params.address;
        const ownerWalletAddress = address;

        if (!web3.utils.isAddress(address)) {
            return res.status(400).send('Invalid address');
        }

        const response = await axios.get(`${ETHERSCAN_API_URL}`, {
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

        const formattedTransactions = await Promise.all(response.data.result.map(async (tx) => {
            let transactionType, tokenAmount, tokenSymbol = null;
            
            if (tx.methodId === '0x3610724e') {
                transactionType = 'Buy Token';
                tokenAmount = tx.input ? parseInt(tx.input.slice(-64), 16) : null;

                // Query MongoDB for the token symbol
                const tokenData = await Token.findOne({ tokenContractAddress: tx.to });
                tokenSymbol = tokenData ? tokenData.symbol : null;
            } else if (tx.from.toLowerCase() === ownerWalletAddress.toLowerCase()) {
                transactionType = 'Withdraw';
            } else if (tx.to.toLowerCase() === ownerWalletAddress.toLowerCase()) {
                transactionType = 'Top up';
            } else {
                transactionType = 'Unknown';
            }

            return {
                transactionType: transactionType,
                from: tx.from.toLowerCase() === ownerWalletAddress.toLowerCase() ? 'You' : tx.from,
                to: tx.to.toLowerCase() === ownerWalletAddress.toLowerCase() ? 'You' : tx.to,
                payableAmount: web3.utils.fromWei(tx.value, 'ether'),
                tokenAmount: transactionType === "Buy Token" ? web3.utils.fromWei(tokenAmount.toString(), 'ether') : tokenAmount,
                tokenSymbol: tokenSymbol, // Adding token symbol
                date: new Date(tx.timeStamp * 1000).toLocaleDateString(),
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