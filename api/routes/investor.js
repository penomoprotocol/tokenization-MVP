//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { ethers } = require('ethers');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config');

// For debugging
console.log(web3.utils);
console.log(ethers.utils);

const fs = require('fs');
const path = require('path');

// Import Contract Artifacts
const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');
const USDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'USDCContract.sol', 'USDCContract.json');

// Get GSC ABI
const contractPath = path.join(GSCBuild);
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const GSCABI = contractJSON.abi;
// Get SC ABI
const SCcontractPath = path.join(SCBuild);
const SCcontractJSON = JSON.parse(fs.readFileSync(SCcontractPath, 'utf8'));
const SCABI = SCcontractJSON.abi;
// Get TC ABI
const TCcontractPath = path.join(TCBuild);
const TCcontractJSON = JSON.parse(fs.readFileSync(TCcontractPath, 'utf8'));
const TCABI = TCcontractJSON.abi;
// Get USDC ABI
const USDCContractPath = path.join(USDCBuild);
const USDCContractJSON = JSON.parse(fs.readFileSync(USDCContractPath, 'utf8'));
const USDCABI = USDCContractJSON.abi;

// Initialize Global Contracts
const GSContract = new web3.eth.Contract(GSCABI, GSCAddress);
const USDContract = new web3.eth.Contract(USDCABI, USDCContractAddress);

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const verifyToken = require('../middleware/jwtCheck');

const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;


const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const express = require('express');
const router = express.Router();

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Company = require('../models/CompanyModel');
const Contract = require('../models/TokenModel');
const Investor = require('../models/InvestorModel');


// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
    console.log(`Current Gas Price: ${gasPrice}`);
    gasPrice = BigInt(gasPrice) * 200n / 100n;
    return gasPrice;
}


// Helper function to estimate gas and send a transaction
async function estimateAndSend(transaction, fromAddress, fromPrivateKey, toAddress, amountInWei) {
    // Fetch the current nonce
    let currentNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');

    // Estimate gas for the transaction
    const estimatedGas = await transaction.estimateGas({ from: fromAddress });

    const bufferGas = estimatedGas * 150n / 100n;  // Adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // Rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    // Prepare the transaction data with nonce
    const txData = {
        from: fromAddress,
        to: toAddress,
        data: transaction.encodeABI(),
        value: amountInWei, // Adding the value field for the amount being sent
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,
        nonce: currentNonce
    };

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


// Helper function to serialize BigInt values in an object
function serializeBigIntInObject(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'bigint') {
            obj[key] = obj[key].toString();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            obj[key] = serializeBigIntInObject(obj[key]);
        }
    }
    return obj;
}

/**
 * @swagger
 * /api/investor/register:
 *   post:
 *     summary: Register an investor
 *     tags: 
 *     - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               surname:
 *                 type: string
 *               firstname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered investor.
 *       500:
 *         description: Error registering investor.
 */

// Investor Registration
router.post('/investor/register', async (req, res) => {
    try {
        const { surname, firstname, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        console.log("Original privateKey: ", privateKey);
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the user's password
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        const investor = new Investor({
            surname,
            firstname,
            email,
            password: hashedPassword,
            ethereumPrivateKey: encryptedPrivateKey, // Store the encrypted private key
            ethereumPublicKey: publicKey, // Store the public key (wallet address)
        });

        await investor.save();
        console.log("Added investor instance: ", investor);

        // Fund the new wallet with 1000000000000000 wei
        const fundingAmount = '1000000000000000'; 

        // Create a raw transaction object
        const transaction = {
            from: MASTER_ADDRESS,
            to: publicKey,
            value: fundingAmount,
            gasLimit: web3.utils.toHex(41000), // Standard gas limit for Ether transfers
            gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()) // Get current gas price
        };
        // Sign the transaction with the master's private key
        const signedTx = await web3.eth.accounts.signTransaction(transaction, MASTER_PRIVATE_KEY);

        // Send the signed transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.status(200).json({ message: "Successfully registered investor.", investor });
    } catch (error) {
        console.error('Error while registering investor or funding wallet:', error);
        res.status(500).send('Error registering investor or funding wallet');
    }
});


/**
 * @swagger
 * /api/investor/login:
 *   post:
 *     summary: Login an investor
 *     tags: 
 *     - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Investor not found or Invalid credentials.
 *       500:
 *         description: Error logging in.
 */

//Investor Login
router.post('/investor/login', async (req, res) => {
    try {
        const investor = await Investor.findOne({ email: req.body.email });
        if (!investor) {
            console.log('Investor not found:', req.body.email); // Add this line for debugging
            return res.status(401).send('Investor not found');
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, investor.password);
        if (isPasswordValid) {
            console.log('Login successful:', investor.email); // Add this line for debugging
            const token = jwt.sign({ id: investor._id }, SECRET_KEY);
            res.json({ token });
        } else {
            console.log('Invalid credentials:', req.body.email); // Add this line for debugging
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Error logging in');
    }
});

/**
 * @swagger
 * /api/investor/verify:
 *   post:
 *     summary: Verify an investor (KYC) and add their wallet address to the GlobalStateContract whitelist.
 *     tags: 
 *       - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - investorId
 *             properties:
 *               investorId:
 *                 type: string
 *                 description: The unique identifier of the investor.
 *     responses:
 *       200:
 *         description: Investor successfully verified.
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: An error occurred or transaction failed.
 */

// TODO: update "verified" status in Investor db instance. Add kyc data, such as passport number, date and signature of KYC provider
// Investor KYC
router.post('/investor/verify', verifyToken, async (req, res) => {
    try {
        const { investorId } = req.body;

        // Fetch investor from the database
        const investor = await Investor.findById(investorId);
        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        // Get investor's public Ethereum address
        const investorWalletAddress = investor.ethereumPublicKey;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GSCABI, GSCAddress);

        // Prepare the transaction object
        const transaction = contract.methods.verifyInvestor(investorWalletAddress);

        // Send the transaction using the estimateAndSend helper function
        const receipt = await estimateAndSend(
            transaction,
            MASTER_ADDRESS,
            MASTER_PRIVATE_KEY,
            GSCAddress
        );

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({ 
                message: 'Investor successfully verified. Whitelisted investor wallet in Global State Contract.',
                transactionHash: receipt.transactionHash  // Include the transaction hash in the response
            });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/investor/buyToken:
 *   post:
 *     summary: Investor buys tokens
 *     tags: 
 *       - Investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - investorEmail
 *               - password
 *               - tokenAmount
 *               - serviceContractAddress
 *             properties:
 *               investorEmail:
 *                 type: string
 *                 format: email
 *                 description: The email of the investor
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password to verify investor's identity
 *               tokenAmount:
 *                 type: number
 *                 description: The amount of tokens the investor wishes to buy
 *               serviceContractAddress:
 *                 type: string
 *                 description: The smart contract address to handle the token purchase
 *     responses:
 *       200:
 *         description: Successfully bought tokens.
 *       400:
 *         description: Bad request if service contract address is missing.
 *       401:
 *         description: Unauthorized if investor is not found or invalid credentials.
 *       500:
 *         description: Error buying tokens.
 */

router.post('/investor/buyToken', async (req, res) => {
    try {
        const { investorEmail, password, tokenAmount, serviceContractAddress } = req.body;

        if (!serviceContractAddress) {
            return res.status(400).send('Missing service contract address.');
        }

        // Step 1: Get the investor from the database using the provided email
        const investor = await Investor.findOne({ email: investorEmail });
        if (!investor) {
            console.log('Investor not found with email:', investorEmail);
            return res.status(401).send('Investor not found');
        }

        // Step 2: Verify password
        const isPasswordValid = await bcrypt.compare(password, investor.password);
        if (!isPasswordValid) {
            console.log('Invalid credentials for investor email:', investorEmail);
            return res.status(401).send('Invalid credentials');
        }


        console.log("investor.ethereumPublicKey: ", investor.ethereumPublicKey);

        // Step 3: Decrypt the private key
        const decryptedPrivateKey = decryptPrivateKey(investor.ethereumPrivateKey, SECRET_KEY);
        console.log("decryptedPrivateKey: ", decryptedPrivateKey);

        const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

        const tokenContractERC20Address = await ServiceContract.methods.tokenContractERC20().call();
        const tokenContractInstance = new web3.eth.Contract(TCABI, tokenContractERC20Address);

        const tokenPrice = await tokenContractInstance.methods.tokenPrice().call();

        // Assuming tokenAmount is the amount of tokens (not in Wei)
        const tokenAmountBigInt = BigInt(tokenAmount);
        const tokenPriceBigInt = BigInt(tokenPrice);
        const requiredWei = tokenPriceBigInt * tokenAmountBigInt;
        const tokenAmountWeiBigInt = BigInt(web3.utils.toWei(tokenAmountBigInt.toString(), 'ether'));


        console.log("tokenPrice: ", tokenPrice.toString());
        console.log("requiredWei: ", requiredWei.toString());
        console.log("tokenAmount: ", tokenAmountBigInt.toString());
        console.log("tokenAmountInWei: ", tokenAmountWeiBigInt.toString());
        console.log("tokenAmountWeiBigInt: ", tokenAmountWeiBigInt);


        const transaction = ServiceContract.methods.buyTokens(tokenAmountWeiBigInt.toString());
        const receipt = await estimateAndSend(transaction, investor.ethereumPublicKey, decryptedPrivateKey, serviceContractAddress, requiredWei.toString());


        const EtherRequiredABI = {
            name: 'EtherRequired',
            type: 'event',
            inputs: [{
                type: 'uint256',
                name: 'value',
                indexed: false
            }]
        };

        const EtherReceivedABI = {
            name: 'EtherReceived',
            type: 'event',
            inputs: [{
                type: 'uint256',
                name: 'value',
                indexed: false
            }]
        };

        const TokensPurchasedABI = {
            name: 'TokensPurchased',
            type: 'event',
            inputs: [{
                type: 'address',
                name: 'investor',
                indexed: true
            }, {
                type: 'uint256',
                name: 'amount',
                indexed: false
            }]
        };


        receipt.logs.forEach(log => {
            try {
                let decodedLog = null;

                // Decode EtherReceived Event
                try {
                    decodedLog = web3.eth.abi.decodeLog(EtherReceivedABI.inputs, log.data, log.topics);
                    console.log("EtherReceived Event:", decodedLog);
                } catch (error) {
                    // If decoding fails, it might be a different event
                }

                // Decode EtherRequired Event
                try {
                    decodedLog = web3.eth.abi.decodeLog(EtherRequiredABI.inputs, log.data, log.topics);
                    console.log("EtherRequired Event:", decodedLog);
                } catch (error) {
                    // If decoding fails, it might be a different event
                }

                // Decode TokensPurchased Event
                try {
                    decodedLog = web3.eth.abi.decodeLog(TokensPurchasedABI.inputs, log.data, log.topics);
                    console.log("TokensPurchased Event:", decodedLog);
                } catch (error) {
                    // If decoding fails, it might be a different event
                }


                if (!decodedLog) {
                    console.log("Unrecognized Event:", log);
                }

            } catch (error) {
                console.error("Error decoding log:", error);
            }
        });

        res.status(200).json({message: "Successfully purchased tokens.", receipt: serializeBigIntInObject(receipt) });

    } catch (error) {
        console.error('Error purchasing tokens:', error);
        res.status(500).send('Failed to purchase tokens.');
    }
});

// /**
//  * @swagger
//  * /api/investor/sellToken:
//  *   post:
//  *     summary: Investor sells tokens by listing them for sale
//  *     description: Allows an investor to list a specified amount of tokens for sale on the platform.
//  *     tags:
//  *       - Investor
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - investorId
//  *               - password
//  *               - amount
//  *               - serviceContractAddress
//  *             properties:
//  *               investorId:
//  *                 type: string
//  *                 description: The unique identifier of the investor.
//  *               password:
//  *                 type: string
//  *                 description: The password for the investor's account.
//  *               amount:
//  *                 type: number
//  *                 description: The number of tokens the investor wishes to sell.
//  *               serviceContractAddress:
//  *                 type: string
//  *                 description: The Ethereum address of the service contract.
//  *     responses:
//  *       200:
//  *         description: Successfully sold tokens.
//  *       500:
//  *         description: Error selling tokens.
//  */


// // Handle investor token sell
// router.post('/investor/sellToken', async (req, res) => {
//     try {
//         const { investorId, password, amount, serviceContractAddress } = req.body;

//         if (!investorId || !password || !amount || !serviceContractAddress) {
//             return res.status(400).send('Missing required parameters.');
//         }

//         // Retrieve and authenticate the investor
//         const investor = await Investor.findById(investorId);
//         if (!investor) {
//             return res.status(404).send('Investor not found.');
//         }

//         const isPasswordValid = await bcrypt.compare(password, investor.password);
//         if (!isPasswordValid) {
//             return res.status(401).send('Invalid credentials.');
//         }

//         // Decrypt the investor's private key
//         const decryptedPrivateKey = decryptPrivateKey(investor.ethereumPrivateKey, SECRET_KEY);

//         // Create a ServiceContract instance
//         const serviceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

//         // Prepare the sellTokens transaction
//         const transaction = serviceContract.methods.sellTokens(amount);

//         // Estimate gas and send the transaction
//         const receipt = await estimateAndSend(transaction, investor.ethereumPublicKey, decryptedPrivateKey, serviceContractAddress, '0');

//         // Respond with the transaction receipt
//         res.status(200).json({ receipt });
//     } catch (error) {
//         console.error('Error selling tokens:', error);
//         res.status(500).send('Failed to sell tokens.');
//     }
// });

/**
 * @swagger
 * /api/investor/jwt:
 *   get:
 *     summary: Retrieve logged-in investor details
 *     tags: 
 *       - Investor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Details of the logged-in investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *       401:
 *         description: Unauthorized if token is missing or invalid.
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error retrieving investor.
 */

// Assuming web3 is already configured and imported, and USDCContract is the instance of the USDC token contract

router.get('/investor/jwt', verifyToken, async (req, res) => {
    try {
        const investorId = req.user.id; // ID is retrieved from the decoded JWT token
        const investor = await Investor.findById(investorId);

        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        // Get ETH balance
        const ethBalanceWei = await web3.eth.getBalance(investor.ethereumPublicKey);
        const ethBalance = web3.utils.fromWei(ethBalanceWei, 'ether');
        

        // Get USDC balance
        const usdcBalanceWei = await USDContract.methods.balanceOf(investor.ethereumPublicKey).call();
        const usdcBalance = web3.utils.fromWei(usdcBalanceWei, 'ether');


        // Add the balances to the investor object that will be returned
        const investorDataWithBalances = {
            ...investor.toObject(), // Convert the mongoose document to a plain object
            ethBalance,
            usdcBalance
        };

        res.json(investorDataWithBalances);
        console.log("investorDataWithBalances: ", investorDataWithBalances);
    } catch (error) {
        console.error('Error retrieving investor details and balances:', error);
        res.status(500).send('Error retrieving investor');
    }
});



/**
 * @swagger
 * /api/investor/{id}:
 *   get:
 *     summary: Retrieve investor details by ID
 *     tags: 
 *       - Investor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the investor to retrieve.
 *     responses:
 *       200:
 *         description: Details of the investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error retrieving investor.
 */
// Retrieve investor details by ID
router.get('/investor/:id',verifyToken, async (req, res) => {
    try {
        const investorId = req.user.id;
        console.log('Retrieving investor details for ID:', investorId); // For debugging
        const investor = await Investor.findById(investorId);
        if (!investor) {
            console.log('Investor not found with ID:', investorId); // For debugging
            return res.status(404).send('Investor not found');
        }
        console.log('Investor details retrieved:', investor); // For debugging
        res.json(investor);
    } catch (error) {
        console.error('Error retrieving investor by ID:', error);
        res.status(500).send('Error retrieving investor');
    }
});


// Retrieve investor details by email
/**
 * @swagger
 * /api/investor/email/{email}:
 *   get:
 *     summary: Retrieve investor details by email
 *     tags: 
 *       - Investor
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The email of the investor to retrieve.
 *     responses:
 *       200:
 *         description: Details of the investor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error retrieving investor.
 */
router.get('/investor/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const investor = await Investor.findOne({ email });
        if (!investor) {
            return res.status(404).send('Investor not found');
        }
        res.json(investor);
    } catch (error) {
        res.status(500).send('Error retrieving investor: ' + error.message);
    }
});

// Update investor details by email
/**
 * @swagger
 * /api/investor/email/{email}:
 *   put:
 *     summary: Update investor details by email
 *     tags: 
 *       - Investor
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The email of the investor to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated investor details.
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error updating investor.
 */
router.put('/investor/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const updates = req.body;
        const updatedInvestor = await Investor.findOneAndUpdate({ email }, updates, { new: true });
        if (!updatedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(updatedInvestor);
    } catch (error) {
        res.status(500).send('Error updating investor: ' + error.message);
    }
});

// Delete investor by email
/**
 * @swagger
 * /api/investor/email/{email}:
 *   delete:
 *     summary: Delete investor by email
 *     tags: 
 *       - Investor
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: The email of the investor to delete.
 *     responses:
 *       200:
 *         description: Deleted investor.
 *       404:
 *         description: Investor not found.
 *       500:
 *         description: Error deleting investor.
 */
router.delete('/investor/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const deletedInvestor = await Investor.findOneAndDelete({ email });
        if (!deletedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(deletedInvestor);
    } catch (error) {
        res.status(500).send('Error deleting investor: ' + error.message);
    }
});


module.exports = router;