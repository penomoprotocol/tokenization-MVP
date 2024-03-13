//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress, USDCContractAddress } = require('../config/web3Config_AGNG');

const fs = require('fs');
const path = require('path');

// Import nodemailer for sending emails
const nodemailer = require('nodemailer');

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
const MAIL_ADDRESS = process.env.MAIL_ADDRESS
const MAIL_PW = process.env.MAIL_PW

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Import Mongoose models:
const Asset = require('../models/AssetModel');
const Investor = require('../models/InvestorModel');
const Token = require('../models/TokenModel');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_ADDRESS,
        pass: process.env.MAIL_PW
    }
});



//// FUNCTIONS ////

// Function to send verification email
async function sendVerificationEmail(email, verificationToken) {
    try {
        // Create email template with verification link
        const verificationLink = `http://localhost:3000/api-docs/#/Investor/register/${verificationToken}`;
        console.log("verificationLink: ", verificationLink);
        const html = `<p>Please click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`;

        // Send email
        const mailOptions = {
            from: MAIL_ADDRESS,
            to: email,
            subject: 'Investor Registration Verification',
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

// Investor Registration
/**
 * @swagger
 * /api/investor/register:
 *   post:
 *     summary: Register a new investor
 *     tags: [Investor]
 *     description: Registers a new investor and sends a verification email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 example: 'John'
 *               surname:
 *                 type: string
 *                 example: 'Doe'
 *               businessName:
 *                 type: string
 *                 example: 'Acme Corporation'
 *               ticker:
 *                 type: string
 *                 example: 'ACME'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'contact@acme.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'securepassword'
 *     responses:
 *       200:
 *         description: Successfully registered investor. Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Successfully registered investor. Verification email sent.'
 *                 investor:
 *                   $ref: '#/components/schemas/Investor'
 *       500:
 *         description: Error registering investor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Error registering investor'
 */
router.post('/investor/register', async (req, res) => {
    try {
        const { firstname, surname, businessName, ticker, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const emailVerificationToken = generateVerificationToken();

        const investor = new Investor({
            firstname,
            surname,
            businessName,
            ticker,
            email,
            password: hashedPassword,
            emailVerificationToken,
        });

        await investor.save();
        console.log("Added investor instance: ", investor);

        // Send verification email
        await sendVerificationEmail(email, emailVerificationToken);

        res.status(200).json({ message: "Successfully registered investor. Verification email sent.", investor });
    } catch (error) {
        console.error('Error while registering investor:', error);
        res.status(500).send('Error registering investor');
    }
});


// Email verification endpoint
/**
 * @swagger
 * /api/investor/register/{token}:
 *   patch:
 *     summary: Verify a investor's email
 *     tags: [Investor]
 *     description: Verifies a investor's email as part of the registration process using the provided token.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to the investor's email.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       404:
 *         description: Invalid verification token.
 *       500:
 *         description: Error verifying email.
 */
router.patch('/investor/register/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const investor = await Investor.findOne({ emailVerificationToken: token });

        if (!investor) {
            return res.status(404).send('Invalid verification token');
        }

        investor.isEmailVerified = true;
        await investor.save();

        res.status(200).send('Email verified successfully');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).send('Error verifying email');
    }
});


// Investor Login
/**
 * @swagger
 * /api/investor/login:
 *   post:
 *     summary: Login for a investor
 *     tags: [Investor]
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
 *                 description: Email of the investor
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the investor account
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
 *         description: Invalid credentials or investor not found
 *       500:
 *         description: Error logging in
 */
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


// Submit investor KYC data (called by investor representative)
/**
 * @swagger
 * /api/investor/kyc/submit/{investorId}:
 *   post:
 *     summary: Submit KYC information for a investor
 *     tags: [Investor]
 *     parameters:
 *       - in: path
 *         name: investorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - surname
 *               - dob
 *               - documentnumber
 *               - address
 *               - phone
 *             properties:
 *               firstname:
 *                 type: string
 *                 description: First name of the contact person
 *               surname:
 *                 type: string
 *                 description: Surname of the contact person
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the contact person
 *               documentNumber:
 *                 type: string
 *                 description: Doc number of the investor
 *               address:
 *                 type: string
 *                 description: Address of the investor
 *               phone:
 *                 type: string
 *                 description: Phone number of the investor
 *     responses:
 *       200:
 *         description: KYC information submitted successfully
 *       404:
 *         description: Investor not found
 *       500:
 *         description: Error submitting KYC information
 */
router.post('/investor/kyc/submit/:investorId', async (req, res) => {
    try {
        const {
            firstname,
            surname,
            dob,
            documentNumber,
            address,
            phone
        } = req.body;

        const investorId = req.params.investorId;

        // Fetch investor from the database
        const investor = await Investor.findById(investorId);
        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        // Update investor with additional verification info
        investor.firstname = firstname;
        investor.surname = surname;
        investor.dob = dob;
        investor.isVerified = "pending"; // Set the investor KYC status as pending

        await investor.save(); // Save the updated investor data

        // Send a response to indicate that the KYC data has been successfully submitted
        res.status(200).json({ message: "KYC information submitted successfully", investor });
    } catch (error) {
        console.error('Error in investor KYC submission:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


// Verify investor KYC data (called by penomo team)
/**
 * @swagger
 * /api/investor/kyc/verify/{investorId}:
 *   post:
 *     summary: Verify KYC data for a investor
 *     description: This endpoint is called by the penomo team or KYC provider / NYALA backend to verify KYC data for a investor.
 *     tags: [Investor]
 *     parameters:
 *       - in: path
 *         name: investorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the investor
 *     responses:
 *       200:
 *         description: Investor KYC data verified and updated successfully
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
 *         description: Investor not found
 *       500:
 *         description: Error verifying investor KYC data
 */
router.post('/investor/kyc/verify/:investorId', async (req, res) => {
    try {
        const investorId = req.params.investorId;

        // Fetch investor from the database
        const investor = await Investor.findById(investorId);
        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        // Update investor with additional verification info
        investor.isKycVerified = true; // Set the investor as verified
        await investor.save(); // Save the updated investor data


        return res.status(200).json({
            message: 'Investor KYC data successfully verified.'
        });

    } catch (error) {
        console.error('Error in investor verification:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});


// Get investor details
/**
 * @swagger
 * /api/investor/{investorId}:
 *   get:
 *     summary: Get details and project data associated with the authenticated investor
 *     description: This endpoint retrieves details and project data associated with a investor.
 *     tags: [Investor]
 *     parameters:
 *       - in: path
 *         name: investorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the investor
 *     responses:
 *       200:
 *         description: Details and project data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier of the investor
 *                 businessName:
 *                   type: string
 *                   description: Name of the investor
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: Email of the investor
 *                 projects:
 *                   type: array
 *                   description: Projects associated with the investor
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Unique identifier of the project
 *                       associatedAssets:
 *                         type: array
 *                         description: Associated assets for the project
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               description: Unique identifier of the asset
 *       404:
 *         description: Investor not found
 *       500:
 *         description: Error retrieving investor details, balances, and project data
 */
router.get('/investor/:investorId', async (req, res) => {
    try {
        const investorId = req.params.investorId;
        const investor = await Investor.findById(investorId);

        if (!investor) {
            return res.status(404).send('Investor not found');
        }

        // let walletAddress = investor.ethereumPublicKey;

        // Fetch investor's general balance information
        // const generalBalance = await fetchBalance(walletAddress);

        // Fetch investor tokens from the database
        const investorTokens = await Token.find({ investorId: investorId });

        // Fetch balance for each serviceContractAddress and add it to the token object
        const tokenData = [];
        for (const token of investorTokens) {

            const associatedAssets = await Asset.find({ _id: { $in: token.assetIds } });

            tokenData.push({
                ...token.toObject(),
                associatedAssets,
            });
        }

        // Add the balances and tokens
        const investorData = {
            ...investor.toObject(), // Convert the mongoose document to a plain object
            // balances: generalBalance,
            tokens: tokenData,
        };

        res.json(investorData);

    } catch (error) {
        res.status(500).send('Error retrieving investor data');
    }
});


// Edit investor details
/**
 * @swagger
 * /api/investor/{investorId}:
 *   patch:
 *     summary: Update investor details
 *     description: Partially update investor details for the authenticated investor or by an admin.
 *     tags: [Investor]
 *     parameters:
 *       - in: path
 *         name: investorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the investor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the investor
 *               ticker:
 *                 type: string
 *                 description: Ticker symbol of the investor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the investor
 *               // Add other properties that can be updated
 *     responses:
 *       200:
 *         description: Investor details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                 updatedInvestor:
 *                   $ref: '#/components/schemas/Investor'
 *       404:
 *         description: Investor not found
 *       500:
 *         description: Error updating investor details
 */
router.patch('/investor/:investorId', async (req, res) => {
    try {
        const updateData = req.body;
        const investorId = req.params.investorId;

        // Optional: Add logic to prevent certain fields from being updated
        // if (updateData.email) {
        //     return res.status(400).send("Email cannot be updated.");
        // }

        const updatedInvestor = await Investor.findByIdAndUpdate(investorId, updateData, { new: true });

        if (!updatedInvestor) {
            return res.status(404).send('Investor not found');
        }

        res.status(200).json({ message: 'Investor details updated successfully', updatedInvestor });
    } catch (error) {
        console.error('Error updating investor details:', error);
        res.status(500).send('Error updating investor details');
    }
});


// Delete investor
/**
 * @swagger
 * /api/investor/{investorId}:
 *   delete:
 *     summary: Delete a investor
 *     description: This endpoint deletes a investor based on the provided investorId.
 *     tags: [Investor]
 *     parameters:
 *       - in: path
 *         name: investorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the investor to delete
 *     responses:
 *       200:
 *         description: Investor deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Deleted investor data
 *       404:
 *         description: Investor not found
 *       500:
 *         description: Error deleting investor
 */
router.delete('/investor/:investorId', async (req, res) => {
    try {
        const investorId = req.query.investorId;
        const deletedInvestor = await Investor.findOneAndDelete({ _id: investorId });
        if (!deletedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(deletedInvestor);
    } catch (error) {
        console.error('Error deleting investor:', error);
        res.status(500).send('Error deleting investor');
    }
});

module.exports = router;