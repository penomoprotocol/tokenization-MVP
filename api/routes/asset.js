//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('../config/web3Config');

const fs = require('fs');
const path = require('path');

const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');
const DIDBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'DID.sol', 'DID.json');

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

//TO DO:
//const Company = require('../models/AssetModel');


// Set up DID contract
// Read the contract's ABI
const contractPath = path.join(DIDBuild);
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const DIDABI = contractJSON.abi;

// The address of the deployed DID contract (replace with actual address)
const DIDContractAddress = '0x0000000000000000000000000000000000000800';

// Initialize the contract with web3
const DIDContract = new web3.eth.Contract(DIDABI, DIDContractAddress);

// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
    return gasPrice;
}


// Helper function to estimate gas and send a transaction
async function estimateAndSend(transaction, fromAddress, fromPrivateKey, toAddress) {

    // Fetch the current nonce
    let currentNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');

    // Estimate gas for the transaction
    const estimatedGas = await transaction.estimateGas({ from: fromAddress });

    const bufferGas = estimatedGas * 110n / 100n;  // adding a 10% buffer
    const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
    let currentGasPrice = await getCurrentGasPrice();

    // Prepare the transaction data with nonce
    const txData = {
        from: fromAddress,
        to: toAddress,
        data: transaction.encodeABI(),
        gas: roundedGas.toString(),
        gasPrice: currentGasPrice,
        nonce: currentNonce
    };

    // Increment the nonce for the next transaction
    currentNonce++;

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
async function deployTokenContract(DIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress) {
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
        arguments: [constructorArgs, DIDs, revenueGoals]
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




/**
 * @swagger
 * /api/asset/register:
 *   post:
 *     summary: Register a new asset and create its DID.
 *     tags: 
 *       - Asset
 *     description: This endpoint registers a new asset, generates a mnemonic seed securely, and creates a DID for the asset. It then returns the DID hash and the newly created DID document.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the asset to register.
 *               controllerDid:
 *                 type: string
 *                 description: The DID of the entity that will control the new asset's DID.
 *     responses:
 *       200:
 *         description: Successfully registered the asset and returned DID information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 didHash:
 *                   type: string
 *                   description: The hash of the DID document.
 *                 didDocument:
 *                   type: object
 *                   description: The newly created DID document for the asset.
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred while registering the asset.
 */

// TODO: Implement sdk integration once migrated to peaq testnet
router.post('/asset/register', async (req, res) => {
    try {
        const { batteryName, companyId, companyPassword } = req.body;

        // Step 1: Get the company from the database using the provided companyId
        const company = await Company.findById(companyId);
        if (!company) {
            console.log('Company not found:', companyId);
            return res.status(401).send('Company not found');
        }

        // Step 2: Verify password
        const isPasswordValid = await bcrypt.compare(companyPassword, company.password);
        if (!isPasswordValid) {
            console.log('Invalid credentials for company ID:', companyId);
            return res.status(401).send('Invalid credentials');
        }

        console.log("company.ethereumPublicKey: ", company.ethereumPublicKey);

        // Step 3: Decrypt the private key (not secure method!)
        const decryptedPrivateKey = decryptPrivateKey(company.ethereumPrivateKey, SECRET_KEY);
        console.log("decryptedPrivateKey: ", decryptedPrivateKey);



        // // Generate a mnemonic seed. In a production environment, ensure this is done securely.
        // const generateMnemonicSeed = () => mnemonicGenerate();

        // // Normally, you would secure the seed phrase and not generate a new one each time
        // const seed = generateMnemonicSeed();

        // // Ensure the seed has a balance before creating the DID
        // // This would typically be done off-line or in a secure environment, not within an API call
        // const sdkInstance = await Sdk.createInstance({
        //     baseUrl: 'wss://wsspc1-qa.agung.peaq.network',
        //     seed,
        // });

        //   const { didHash } = await sdkInstance.did.create({
        //     name,
        //     controller: controllerDid, // Set the controller to the company's DID
        //   });

        //   await sdkInstance.disconnect();

        const did = "did:peaq:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"

        // Return the DID hash and the DID document to the caller
        res.status(200).json({
            did
        });

    } catch (error) {
        console.error('Error registering asset:', error);
        res.status(500).send('Error registering asset.');
    }
});


/**
 * @swagger
 * /api/asset/storeData:
 *   post:
 *     summary: Store asset data in IPFS and update the asset's DID document.
 *     tags: 
 *       - Asset
 *     description: This endpoint stores asset-related data on IPFS and then updates the asset's DID document with a reference to this data. It requires the DID of the asset and the company's private key for authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batteryType
 *               - capacity
 *               - voltage
 *               - didName
 *               - companySeed
 *             properties:
 *               batteryType:
 *                 type: string
 *                 description: The type of the battery.
 *               capacity:
 *                 type: string
 *                 description: The capacity of the battery.
 *               voltage:
 *                 type: string
 *                 description: The voltage of the battery.
 *               didName:
 *                 type: string
 *                 description: The DID of the asset to be updated.
 *               companySeed:
 *                 type: string
 *                 description: The company's private key for authentication purposes.
 *     responses:
 *       200:
 *         description: Successfully stored asset data and updated the DID document.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cid:
 *                   type: string
 *                   description: The Content Identifier (CID) of the stored data in IPFS.
 *                 message:
 *                   type: string
 *                   description: Confirmation message about the DID document update.
 *       400:
 *         description: Missing required fields in the request.
 *       500:
 *         description: Error occurred while storing data or updating the DID document.
 */
router.post('/asset/storeData', async (req, res) => {
    try {
        const { batteryType, capacity, voltage, batteryDid, companyId, companyPassword } = req.body;

        if (!batteryType || !capacity || !voltage || !batteryDid || !companyId || companyPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store battery data on IPFS
        const batteryData = {
            batteryType,
            capacity,
            voltage,
        };

        const cid = "ipfs://bafybeihpjhkeuiq3k6nqa3fkgeigeri7iebtrsuyuey5y6vy36n345xmbi/23";
        // const { cid } = await ipfs.add(JSON.stringify(batteryData));

        // // Prepare the attribute data
        // const attributeKey = web3.utils.sha3('BatteryDataStorage');
        // const attributeValue = `ipfs://${cid}`;

        // // Create a transaction object
        // const transaction = DIDContract.methods.add_attribute(
        //     web3.utils.asciiToHex(batteryDid), // DID account in hex
        //     attributeKey, // Attribute key as bytes32
        //     web3.utils.asciiToHex(attributeValue), // Attribute value as hex
        //     0 // Validity (0 if not applicable)
        // );

        // // Send the transaction using the estimateAndSend helper function
        // const receipt = await estimateAndSend(transaction, MASTER_ADDRESS, MASTER_PRIVATE_KEY, DIDContractAddress);

        // Respond with the IPFS CID and transaction receipt
        res.status(200).json({
            cid: cid.toString(),
            message: 'DID document updated with new battery data CID',
            // transactionReceipt: receipt
        });
    } catch (error) {
        console.error('Error updating DID document with battery data:', error);
        res.status(500).json({ error: 'Failed to update DID document with battery data' });
    }
});

/**
 * @swagger
 * /api/asset/tokenize:
 *   post:
 *     summary: Tokenize an asset
 *     tags: 
 *       - Asset
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
 *               - revenueGoals
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
 *                 description: Array of Digital Identity Identifiers.
 *               revenueGoals:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of revenue goals for each asset.
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

router.post('/asset/tokenize', async (req, res) => {
    try {
        // Get data from the request
        const {companyId, password, DIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice} = req.body;

        if (!companyId || !password || !DIDs || !revenueGoals || !name || !symbol || !revenueShare || !contractTerm || !maxTokenSupply || !tokenPrice) {
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

        // Deploy the ServiceContract and get its address
        const serviceContractAddress = await deployServiceContract(GSCAddress);

        // Deploy the TokenContract using the ServiceContract's address
        const tokenContractAddress = await deployTokenContract(DIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress);

        // Deploy LiquidityContract
        const liquidityContractAddress = await deployLiquidityContract(serviceContractAddress, company.ethereumPublicKey, MASTER_ADDRESS);

        // Deploy RevenueDistributionContract
        const revenueDistributionContractAddress = await deployRevenueDistributionContract(serviceContractAddress, tokenContractAddress, liquidityContractAddress);

        // Get SC ABI
        const contractPath = path.join(SCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const SCABI = contractJSON.abi;

        // Create a ServiceContract instance
        const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

        // Call setTokenContract with gas estimation and send
        await estimateAndSend(ServiceContract.methods.setContractAddresses(tokenContractAddress, liquidityContractAddress, revenueDistributionContractAddress), MASTER_ADDRESS, MASTER_PRIVATE_KEY, serviceContractAddress);

        // TODO: Generate DB entry for new token contract


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
 * /api/asset/connectRevenueStream:
 *   post:
 *     summary: Deploy a new RevenueStreamContract and connect it to a service contract
 *     description: This endpoint deploys a RevenueStreamContract for managing the revenue stream of a battery asset and connects it to an existing service contract.
 *     tags: 
 *       - Asset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceContractAddress
 *               - pricePerKWh
 *               - authorizedBattery
 *             properties:
 *               serviceContractAddress:
 *                 type: string
 *                 description: Ethereum address of the service contract to connect with.
 *               pricePerKWh:
 *                 type: number
 *                 format: float
 *                 description: Price per kWh in wei for calculating revenue.
 *               authorizedBattery:
 *                 type: string
 *                 description: Ethereum address of the authorized battery.
 *     responses:
 *       200:
 *         description: Revenue stream contract deployed successfully and connected to the service contract.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 contractAddress:
 *                   type: string
 *                   description: Ethereum address of the deployed RevenueStreamContract.
 *       500:
 *         description: Error occurred during the process.
 */


router.post('/asset/connectRevenueStream', async (req, res) => {
    try {
        const { serviceContractAddress, pricePerKWh, authorizedBattery } = req.body;

        // Validate inputs
        if (!serviceContractAddress || !pricePerKWh || !authorizedBattery) {
            return res.status(400).send('Missing required parameters');
        }

        // Read the contract's ABI and bytecode
        const contractPath = path.join(RSCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const RSCABI = contractJSON.abi;
        const RSCBytecode = contractJSON.bytecode;

        // Create a new contract instance
        const RSCContract = new web3.eth.Contract(RSCABI);

        // Create the deployment data
        const deploymentData = RSCContract.deploy({
            data: RSCBytecode,
            arguments: [serviceContractAddress, pricePerKWh, authorizedBattery]
        });

        // Estimate gas for the deployment and add buffer
        const estimatedGas = await deploymentData.estimateGas({ from: MASTER_ADDRESS });
        const bufferGas = estimatedGas * 110n / 100n;
        const roundedGas = bufferGas + (10n - bufferGas % 10n);
        let currentGasPrice = await getCurrentGasPrice();

        // Prepare the transaction data
        const deployTx = {
            data: deploymentData.encodeABI(),
            gas: roundedGas.toString(),
            gasPrice: currentGasPrice.toString(),
            from: MASTER_ADDRESS
        };

        // Sign the transaction with the master's private key
        const signedTx = await web3.eth.accounts.signTransaction(deployTx, MASTER_PRIVATE_KEY);

        // Send the signed transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        // Respond with the contract's deployed address
        res.status(200).json({
            message: 'Revenue stream contract deployed successfully',
            contractAddress: receipt.contractAddress
        });
    } catch (error) {
        console.error('Error deploying revenue stream contract:', error);
        res.status(500).send('Failed to deploy revenue stream contract');
    }
});

/**
 * @swagger
 * /api/asset/{did}:
 *   get:
 *     summary: Retrieve asset details by DID
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         description: The DID of the asset to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved asset details.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error retrieving asset.
 */

router.get('/asset/:did', (req, res) => {
    // Retrieve asset details
});

/**
 * @swagger
 * /api/asset/{did}:
 *   put:
 *     summary: Update asset details by DID
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         description: The DID of the asset to update.
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
 *         description: Successfully updated asset details.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error updating asset.
 */

router.put('/asset/:did', (req, res) => {
    // Update asset details
});

/**
 * @swagger
 * /api/asset/{id}:
 *   delete:
 *     summary: Delete asset by ID
 *     tags: 
 *     - Asset
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the asset to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted asset.
 *       404:
 *         description: Asset not found.
 *       500:
 *         description: Error deleting asset.
 */

router.delete('/asset/:id', (req, res) => {
    // Delete asset 
});

module.exports = router;