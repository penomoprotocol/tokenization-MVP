//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config_AGNG');

const fs = require('fs');
const path = require('path');

// Import nodemailer for sending emails
const nodemailer = require('nodemailer');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.yourmailserver.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password'
    }
});


const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');
const USDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'USDCContract.sol', 'USDCContract.json');

// Get GSC ABI
const GSCPath = path.join(GSCBuild);
const GSCJSON = JSON.parse(fs.readFileSync(GSCPath, 'utf8'));
const GSCABI = GSCJSON.abi;

// Get TC ABI
const TCPath = path.join(TCBuild);
const TCJSON = JSON.parse(fs.readFileSync(TCPath, 'utf8'));
const TCABI = TCJSON.abi;

// Get LC ABI
const LCPath = path.join(LCBuild);
const LCJSON = JSON.parse(fs.readFileSync(LCPath, 'utf8'));
const LCABI = LCJSON.abi;

// Get USDC ABI
const USDCContractPath = path.join(USDCBuild);
const USDCContractJSON = JSON.parse(fs.readFileSync(USDCContractPath, 'utf8'));
const USDCABI = USDCContractJSON.abi;

const verifyToken = require('../middleware/jwtCheck');
const verifyApiKey = require('../middleware/verifyApiKey');


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
const axios = require('axios');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;
const BLOCKEXPLORER_API_URL = process.env.BLOCKEXPLORER_API_URL
const BLOCKEXPLORER_API_KEY = process.env.BLOCKEXPLORER_API_KEY

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Company = require('../models/CompanyModel');
const Token = require('../models/TokenModel');
const Investor = require('../models/InvestorModel');


//// FUNCTIONS ////

// Function to send verification email
async function sendVerificationEmail(email, verificationToken) {
    try {
        // Create email template with verification link
        const verificationLink = `http://yourdomain.com/api/company/verify/${verificationToken}`;
        const html = `<p>Please click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`;

        // Send email
        const mailOptions = {
            from: 'your-email@example.com',
            to: email,
            subject: 'Company Registration Verification',
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.response);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
}

// Generate a verification token
function generateVerificationToken() {
    return jwt.sign({ timestamp: new Date().getTime() }, process.env.SECRET_KEY);
}

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

        const bufferGas = estimatedGas * 200n / 100n;
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

// Function to serialize BigInt values in an object
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

// Function to fetch balance for a given address
async function fetchBalance(address) {
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
        // console.log("Fetch contract balance response: ", response.data.ERC20);
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

// Fuction to timelimit api calls 
function rateLimiter(rateLimit, requestFunction) {
    let lastCalled = Date.now();

    return async (...args) => {
        const now = Date.now();
        const diff = now - lastCalled;
        const delay = Math.max((1000 / rateLimit) - diff, 0);

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const result = await requestFunction(...args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
                lastCalled = Date.now();
            }, delay);
        });
    };
}

// Function to delay api calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


//// ROUTES ////

// Company Registration
router.post('/company/register', async (req, res) => {
    try {
        const { businessName, ticker, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = generateVerificationToken();

        const company = new Company({
            businessName,
            ticker,
            email,
            password: hashedPassword,
            verificationToken,
        });

        await company.save();
        console.log("Added company instance: ", company);

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(200).json({ message: "Successfully registered company. Verification email sent.", company });
    } catch (error) {
        console.error('Error while registering company:', error);
        res.status(500).send('Error registering company');
    }
});

// Email verification endpoint
router.get('/company/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const company = await Company.findOne({ verificationToken: token });

        if (!company) {
            return res.status(404).send('Invalid verification token');
        }

        company.verified = true;
        await company.save();

        res.status(200).send('Email verified successfully');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).send('Error verifying email');
    }
});


// Company Login
/**
 * @swagger
 * /api/company/login:
 *   post:
 *     summary: Login for a company
 *     tags: [Company]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the company
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the company account
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Invalid credentials or company not found
 *       500:
 *         description: Error logging in
 */
router.post('/company/login', async (req, res) => {
    try {
        const company = await Company.findOne({ email: req.body.email });
        if (!company) {
            console.log('Company not found:', req.body.email); // Add this line for debugging
            return res.status(401).send('Company not found');
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, company.password);
        if (isPasswordValid) {
            console.log('Login successful:', company.email); // Add this line for debugging
            const token = jwt.sign({ id: company._id }, SECRET_KEY);
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

// Submit company KYC data (called by company representative)
/**
 * @swagger
 * /api/company/kyc/submit:
 *   post:
 *     summary: Submit KYC information for a company
 *     tags: [Company]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - firstName
 *               - surname
 *               - dob
 *               - businessName
 *               - registrationNumber
 *               - businessAddress
 *               - businessPhone
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: ID of the company
 *               firstName:
 *                 type: string
 *                 description: First name of the contact person
 *               surname:
 *                 type: string
 *                 description: Surname of the contact person
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the contact person
 *               businessName:
 *                 type: string
 *                 description: Name of the company
 *               registrationNumber:
 *                 type: string
 *                 description: Registration number of the company
 *               businessAddress:
 *                 type: string
 *                 description: Address of the company
 *               businessPhone:
 *                 type: string
 *                 description: Phone number of the company
 *     responses:
 *       200:
 *         description: KYC information submitted successfully
 *       404:
 *         description: Company not found
 *       500:
 *         description: Error submitting KYC information
 */
router.post('/company/kyc/submit', async (req, res) => {
    try {
        const {
            companyId,
            firstName,
            surname,
            dob,
            businessName,
            registrationNumber,
            businessAddress,
            businessPhone } = req.body;

        // Fetch company from the database
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).send('Company not found');
        }

        // Update company with additional verification info
        company.firstname = firstName;
        company.surname = surname;
        company.dob = dob;
        company.businessName = businessName;
        company.registrationNumber = registrationNumber;
        company.businessAddress = businessAddress;
        company.businessPhone = businessPhone;
        company.isVerified = "pending"; // Set the company KYC status as pending

        await company.save(); // Save the updated company data


    } catch (error) {
        console.error('Error in company KYC submission:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

// Verify company KYC data (called by penomo team or KYC provider / NYALA backend? )
/**
 * @swagger
 * /api/company/kyc/verify:
 *   post:
 *     summary: Verify KYC data for a company
 *     description: This endpoint is called by the penomo team or KYC provider / NYALA backend to verify KYC data for a company.
 *     tags: [Company]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: ID of the company
 *     responses:
 *       200:
 *         description: Company KYC data verified and updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                 transactionHash:
 *                   type: string
 *                   description: Hash of the transaction in the blockchain
 *       404:
 *         description: Company not found
 *       500:
 *         description: Error verifying company KYC data
 */
router.post('/company/kyc/verify', verifyApiKey, async (req, res) => {
    try {
        const { companyId } = req.body;

        // Fetch company from the database
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).send('Company not found');
        }

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the user's password
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        // Fund the new wallet with 1000000000000000 wei
        const fundingAmount = '1000000000000000'; // 1000000000000000 wei

        // Create a raw transaction object
        const fundingTransaction = {
            from: MASTER_ADDRESS,
            to: publicKey,
            value: fundingAmount,
            gasLimit: web3.utils.toHex(21000), // Standard gas limit for Ether transfers
            gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()) // Get current gas price
        };
        // Sign the transaction with the master's private key
        const signedTx = await web3.eth.accounts.signTransaction(transaction, MASTER_PRIVATE_KEY);

        // Send the signed transaction
        const fundingReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GSCABI, GSCAddress);

        // Prepare the transaction object
        const whitelistTransaction = contract.methods.verifyCompany(publicKey);

        // Send the transaction using the estimateAndSend helper function
        const whitelistreceipt = await estimateAndSend(
            transaction,
            MASTER_ADDRESS,
            MASTER_PRIVATE_KEY,
            GSCAddress
        );

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);


        // Update company with additional verification info
        company.firstname = firstName;
        company.surname = surname;
        company.dob = dob;
        company.businessName = businessName;
        company.registrationNumber = registrationNumber;
        company.businessAddress = businessAddress;
        company.businessPhone = businessPhone;
        company.ethereumPrivateKey = encryptedPrivateKey, // Store the encrypted private key
        company.ethereumPublicKey = publicKey, // Store the public key (wallet address)
        company.isVerified = true; // Set the company as verified
        await company.save(); // Save the updated company data

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({
                message: 'Company successfully verified and whitelisted in Global State Contract.',
                transactionHash: receipt.transactionHash
            });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }

    } catch (error) {
        console.error('Error in company verification:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

// Get company contracts 
/**
 * @swagger
 * /api/company/contracts:
 *   get:
 *     summary: Get contracts associated with the authenticated company
 *     description: This endpoint retrieves contracts associated with the authenticated company along with their associated assets.
 *     tags: [Company]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Contracts and associated assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contracts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Unique identifier of the contract
 *                       companyId:
 *                         type: string
 *                         description: ID of the company associated with the contract
 *                       serviceContractAddress:
 *                         type: string
 *                         description: Address of the service contract
 *                       liquidityPoolBalance:
 *                         type: number
 *                         description: Balance of the liquidity pool associated with the contract
 *                       associatedAssets:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               description: Unique identifier of the asset
 *                             DID:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   description: Decentralized Identifier (DID) of the asset
 *                             name:
 *                               type: string
 *                               description: Name of the asset
 *       404:
 *         description: Company not found
 *       500:
 *         description: Error retrieving company contracts with associated assets
 */
router.get('/company/contracts', verifyToken, async (req, res) => {
    try {
        const companyId = req.user.id; // ID is retrieved from the decoded JWT token
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).send('Company not found');
        }

        // Fetch company tokens from the database
        const companyTokens = await Token.find({ companyId: companyId });

        // Fetch balance for each serviceContractAddress and add it to the token object
        const companyContracts = await Promise.all(
            companyTokens.map(async (token) => {
                const liquidityPoolBalance = await fetchBalance(token.serviceContractAddress);

                // Fetch associated assets for each token
                const associatedAssets = await Asset.find({
                    'DID.id': { $in: token.assetDIDs }
                });

                return {
                    ...token.toObject(),
                    liquidityPoolBalance,
                    associatedAssets
                };
            })
        );

        // Add the balances and tokens with their liquidity pools and associated assets to the company object
        const companyContractsWithAssets = {
            contracts: companyContracts
        };

        res.json(companyContractsWithAssets);

    } catch (error) {
        console.error('Error retrieving company contracts with associated assets:', error);
        res.status(500).send('Error retrieving company');
    }
});

// Get company details
/**
 * @swagger
 * /api/company/:
 *   get:
 *     summary: Get details, balances, and token data associated with the authenticated company
 *     description: This endpoint retrieves details, balances, and token data associated with the authenticated company.
 *     tags: [Company]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Details, balances, and token data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier of the company
 *                 businessName:
 *                   type: string
 *                   description: Name of the company
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: Email of the company
 *                 balances:
 *                   type: object
 *                   description: General balance information
 *                   properties:
 *                     // Define balance properties here
 *                 tokens:
 *                   type: array
 *                   description: Tokens associated with the company
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Unique identifier of the token
 *                       liquidityPoolBalance:
 *                         type: number
 *                         description: Balance of the liquidity pool associated with the token
 *                       associatedAssets:
 *                         type: array
 *                         description: Associated assets for the token
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               description: Unique identifier of the asset
 *                       tokenHolders:
 *                         type: array
 *                         description: Holders of the token
 *                         items:
 *                           type: object
 *                           properties:
 *                             address:
 *                               type: string
 *                               description: Address of the token holder
 *                             tokenBalance:
 *                               type: string
 *                               description: Token balance of the holder
 *                             holdingPercentage:
 *                               type: number
 *                               description: Percentage of tokens held by the holder
 *                             data:
 *                               type: object
 *                               description: Additional data about the holder
 *       404:
 *         description: Company not found
 *       500:
 *         description: Error retrieving company details, balances, and token data
 */
router.get('/company/', verifyToken, async (req, res) => {
    try {
        const companyId = req.user.id; // ID is retrieved from the decoded JWT token
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).send('Company not found');
        }

        let walletAddress = company.ethereumPublicKey;

        // Fetch company's general balance information
        const generalBalance = await fetchBalance(walletAddress);

        // Fetch company tokens from the database
        const companyTokens = await Token.find({ companyId: companyId });

        // Fetch balance for each serviceContractAddress and add it to the token object
        const tokenData = [];
        for (const token of companyTokens) {
            // Fetch liquidity pool balance and associated assets
            const liquidityPoolBalance = await fetchContractBalance(token.liquidityContractAddress);
            await delay(1000 / 1000); // Introduce a delay to respect the rate limit

            const associatedAssets = await Asset.find({ _id: { $in: token.assetIds } });

            // Initialize the contract instance for the token
            const contract = new web3.eth.Contract(TCABI, token.tokenContractAddress);
            const tokenHolders = await contract.methods.getTokenHolders().call();

            // Fetch the maxTokenSupply for the token - assuming this is available in the token object
            const maxTokenSupply = token.maxTokenSupply;

            const holdersData = await Promise.all(tokenHolders.map(async (holderAddress) => {
                // Fetch token balance for the holder and immediately convert it to a string
                const tokenBalanceWei = (await contract.methods.balanceOf(holderAddress).call()).toString();
                const tokenBalance = web3.utils.fromWei(tokenBalanceWei, 'ether');

                // Since tokenBalance is now a string, parsing it to a float should be safe
                const holdingPercentage = (parseFloat(tokenBalance) / parseFloat(maxTokenSupply)) * 100;

                // Fetch investor instance from the database
                const investorInstance = await Investor.findOne({ ethereumPublicKey: holderAddress });

                return {
                    address: holderAddress,
                    tokenBalance, // Already a string, safe for JSON serialization
                    holdingPercentage, // A float, also safe
                    data: investorInstance // Ensure investorInstance doesn't contain BigInts; if it does, convert those as well
                };
            }));

            tokenData.push({
                ...token.toObject(),
                liquidityPoolBalance,
                associatedAssets,
                tokenHolders: holdersData // Replace the simple list with detailed holders data
            });
        }

        // Add the balances and tokens with their liquidity pools to the company object
        const companyDataWithBalancesAndTokenData = {
            ...company.toObject(), // Convert the mongoose document to a plain object
            balances: generalBalance,
            tokens: tokenData,
        };

        res.json(companyDataWithBalancesAndTokenData);

    } catch (error) {
        console.error('Error retrieving company details, balances, and token data:', error);
        res.status(500).send('Error retrieving company');
    }
});

// Update company details
/**
 * @swagger
 * /api/company/:
 *   put:
 *     summary: Update company details
 *     description: Update company details for the authenticated company or by an admin
 *     tags: [Company]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: ID of the company
 *     responses:
 *       200:
 *         description: Company details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *       404:
 *         description: Company not found
 *       500:
 *         description: Error updating company details
 */
router.put('/company/', verifyToken, async (req, res) => {
    try {
        const { companyId, ...updateData } = req.body;
        const decodedCompanyId = req.user.id;

        // Check if the authenticated user is an admin
        if (!decodedCompanyId) {
            // Admin authentication via API key
            // Implement admin check here if needed
            // Example: const isAdmin = checkAdmin(req);
            // if (!isAdmin) return res.status(401).send('Unauthorized');
        } else {
            // Authenticated company's companyId should match with the request companyId
            if (companyId !== decodedCompanyId) {
                return res.status(403).send('Forbidden');
            }
        }

        const updatedCompany = await Company.findByIdAndUpdate(companyId, updateData, { new: true });

        if (!updatedCompany) {
            return res.status(404).send('Company not found');
        }

        res.status(200).json({ message: 'Company details updated successfully', updatedCompany });
    } catch (error) {
        console.error('Error updating company details:', error);
        res.status(500).send('Error updating company details');
    }
});

// Delete company
/**
 * @swagger
 * /api/company/:
 *   delete:
 *     summary: Delete a company
 *     description: This endpoint deletes a company based on the provided companyId.
 *     tags: [Company]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the company to delete
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Deleted company data
 *       404:
 *         description: Company not found
 *       500:
 *         description: Error deleting company
 */
router.delete('/company/', async (req, res) => {
    try {
        const companyId = req.query.companyId;
        const deletedCompany = await Company.findOneAndDelete({ _id: companyId });
        if (!deletedCompany) {
            return res.status(404).send('Company not found');
        }
        res.json(deletedCompany);
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).send('Error deleting company');
    }
});

module.exports = router;