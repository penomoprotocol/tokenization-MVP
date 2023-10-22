//const web3 = require('web3');
const CryptoJS = require('crypto-js');
const { web3, networkId, GSCAddress } = require('./config/web3Config');

const fs = require('fs');
const path = require('path');

const GSCBuild = path.join(__dirname, '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');


const express = require('express');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();


// // // INITIALIZE

// Get variables from .env
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;


// Initialize app
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Define company schema and model
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    ethereumPrivateKey: {
        type: String, // Store the encrypted private key as a string
    },
    ethereumPublicKey: {
        type: String,
    },
});

const Company = mongoose.model('Company', companySchema);


// Define investor schema and model
const investorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    ethereumPrivateKey: {
        type: String, // Store the encrypted private key as a string
    },
    ethereumPublicKey: {
        type: String,
    },
    // ... 
});
const Investor = mongoose.model('Investor', investorSchema);

// Import database models -> TO DO: IMPORT 
// const Company = require('../database/models/Company');
// const Investor = require('../database/models/Investor');
// const Asset = require('../database/models/Asset');
// const Transaction = require('../database/models/Transaction');


// JWT configuration
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: SECRET_KEY
};

// Initialize passport
passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
}));
app.use(passport.initialize());

// Listen to server port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// // // FUNCTIONS

// Get gas price
async function getCurrentGasPrice() {
    let gasPrice = await web3.eth.getGasPrice(); // This will get the current gas price in wei
    return gasPrice;
}


// Helper function to estimate and send the transaction
async function estimateAndSend(transaction, fromAddress, toAddress) {

    // Fetch the current nonce
    let currentNonce = await web3.eth.getTransactionCount(MASTER_ADDRESS, 'pending');

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
    const signedTx = await web3.eth.accounts.signTransaction(txData, MASTER_PRIVATE_KEY);

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
async function deployTokenContract(DIDs, CIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress) {
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
        arguments: [constructorArgs, DIDs, CIDs, revenueGoals]
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




// // // ROUTES

// app.get('/protectedRoute', passport.authenticate('jwt', { session: false }), (req, res) => {
//     res.send('This is a protected route!');
// });

// // Company Routes

// Company Registration
app.post('/company/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the user's password
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        const company = new Company({
            name,
            email,
            password: hashedPassword,
            ethereumPrivateKey: encryptedPrivateKey, // Store the encrypted private key
            ethereumPublicKey: publicKey, // Store the public key (wallet address)
        });

        await company.save();
        console.log("Added company instance: ", company);
        res.status(200).json({ company });
    } catch (error) {
        console.error('Error while registering company:', error);
        res.status(500).send('Error registering company');
    }
});

// Company Login
app.post('/company/login', async (req, res) => {
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

// Company KYC
app.post('/company/verify', async (req, res) => {
    try {
        const { companyWalletAddress } = req.body;

        // Get GSC ABI
        const contractPath = path.join(GSCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const GSCABI = contractJSON.abi;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GSCABI, GSCAddress);
        //console.log("contract: ", contract);

        // Prepare the transaction data
        const data = contract.methods.verifyCompany(companyWalletAddress).encodeABI();
        //console.log("data: ", data);

        // Fetch the nonce for the sender's address
        const senderAddress = MASTER_ADDRESS; // Replace with the sender's Ethereum address
        const nonce = await web3.eth.getTransactionCount(senderAddress);

        // Prepare the transaction object
        let currentGasPrice = await getCurrentGasPrice();

        const gasLimit = 200000; // Adjust the gas limit as needed
        const rawTransaction = {
            from: MASTER_ADDRESS,
            to: GSCAddress,
            gas: gasLimit,
            gasPrice: currentGasPrice,
            nonce,
            data,
        };

        // Sign the transaction with the private key
        const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction, MASTER_PRIVATE_KEY);
        console.log("signedTransaction: ", signedTransaction);

        // Send the signed transaction to the network
        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({ message: 'Company successfully verified' });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }
    } catch (error) {
        console.error('Error in company registration:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

// Retrieve company details by ID
app.get('/company/:id', async (req, res) => {
    try {
        const companyId = req.body._id;
        console.log('Retrieving company details for ID:', companyId); // Add this line for debugging
        const company = await Company.findById(companyId);
        if (!company) {
            console.log('Company not found:', companyId); // Add this line for debugging
            return res.status(404).send('Company not found');
        }
        console.log('Company details retrieved:', company); // Add this line for debugging
        res.json(company);
    } catch (error) {
        console.error('Error retrieving company:', error);
        res.status(500).send('Error retrieving company');
    }
});

// Update company details by ID
app.put('/company/:id', async (req, res) => {
    try {
        const companyId = req.body._id;
        const updates = req.body;
        const updatedCompany = await Company.findByIdAndUpdate(companyId, updates, { new: true });
        if (!updatedCompany) {
            return res.status(404).send('Company not found');
        }
        res.json(updatedCompany);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).send('Error updating company');
    }
});

// Delete company by ID
app.delete('/company/:id', async (req, res) => {
    try {
        const companyId = req.body._id;
        const deletedCompany = await Company.findByIdAndRemove(companyId);
        if (!deletedCompany) {
            return res.status(404).send('Company not found');
        }
        res.json(deletedCompany);
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).send('Error deleting company');
    }
});



// // Investor Routes

// Investor Registration
app.post('/investor/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        const publicKey = wallet.address; // Get the public key (wallet address)

        // Encrypt the private key with the user's password
        const encryptedPrivateKey = encryptPrivateKey(privateKey, SECRET_KEY);

        const investor = new Investor({
            name,
            email,
            password: hashedPassword,
            ethereumPrivateKey: encryptedPrivateKey, // Store the encrypted private key
            ethereumPublicKey: publicKey, // Store the public key (wallet address)
        });

        await investor.save();
        console.log("Added investor instance: ", investor);
        res.status(200).json({ investor });
    } catch (error) {
        console.error('Error while registering investor:', error);
        res.status(500).send('Error registering investor');
    }
});

//Investor Login
app.post('/investor/login', async (req, res) => {
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

// Investor KYC
app.post('/investor/verify', async (req, res) => {
    try {
        const { investorWalletAddress } = req.body;

        // Get GSC ABI
        const contractPath = path.join(GSCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const GSCABI = contractJSON.abi;

        // Prepare the contract instance
        const contract = new web3.eth.Contract(GSCABI, GSCAddress);
        //console.log("contract: ", contract);

        // Prepare the transaction data
        const data = contract.methods.verifyInvestor(investorWalletAddress).encodeABI();
        //console.log("data: ", data);

        // Fetch the nonce for the sender's address
        const senderAddress = MASTER_ADDRESS; // Replace with the sender's Ethereum address
        const nonce = await web3.eth.getTransactionCount(senderAddress);

        // Prepare the transaction object
        let currentGasPrice = await getCurrentGasPrice();

        const gasLimit = 200000; // Adjust the gas limit as needed
        const rawTransaction = {
            from: MASTER_ADDRESS,
            to: GSCAddress,
            gas: gasLimit,
            gasPrice: currentGasPrice,
            nonce,
            data,
        };

        // Sign the transaction with the private key
        const signedTransaction = await web3.eth.accounts.signTransaction(rawTransaction, MASTER_PRIVATE_KEY);
        console.log("signedTransaction: ", signedTransaction);

        // Send the signed transaction to the network
        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        // Handle the transaction receipt
        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status) {
            return res.status(200).json({ message: 'Investor successfully verified' });
        } else {
            return res.status(500).json({ error: 'Transaction failed' });
        }
    } catch (error) {
        console.error('Error in investor registration:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

// Handle investor token purchase
app.post('/investor/buyToken', async (req, res) => {
    try {
        const { investorWallet, privateKey, tokenAmount } = req.body;

        if (!investorWallet || !privateKey || !tokenAmount) {
            return res.status(400).send('Missing required parameters.');
        }

        const contractPath = path.join(SCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const SCABI = contractJSON.abi;

        // Create a ServiceContract instance
        const ServiceContract = new web3.eth.Contract(SCABI, "SERVICE_CONTRACT_ADDRESS_HERE"); // Replace with your deployed ServiceContract address

        const tokenPrice = await ServiceContract.methods.tokenContractERC20().methods.tokenPrice().call();

        // Calculate required Ether to buy desired amount of tokens
        const requiredEther = BigInt(tokenPrice) * BigInt(tokenAmount);

        // Prepare transaction
        const txData = {
            to: "SERVICE_CONTRACT_ADDRESS_HERE", // Replace with your deployed ServiceContract address
            data: ServiceContract.methods.buyTokens(tokenAmount).encodeABI(),
            value: requiredEther.toString(),
            gasPrice: await web3.eth.getGasPrice(),
            nonce: await web3.eth.getTransactionCount(investorWallet)
        };

        // Estimate gas for the transaction
        txData.gas = await web3.eth.estimateGas(txData);

        // Sign transaction
        const signedTx = await web3.eth.accounts.signTransaction(txData, privateKey);

        // Send signed transaction
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.status(200).json({ txHash: txReceipt.transactionHash });

    } catch (error) {
        console.error('Error purchasing tokens:', error);
        res.status(500).send('Failed to purchase the tokens.');
    }
});

// Retrieve investor details by ID
app.get('/investor/:id', async (req, res) => {
    try {
        const investorId = req.body._id;
        console.log('Retrieving investor details for ID:', investorId); // Add this line for debugging
        const investor = await Investor.findById(investorId);
        if (!investor) {
            console.log('Investor not found:', investorId); // Add this line for debugging
            return res.status(404).send('Investor not found');
        }
        console.log('Investor details retrieved:', investor); // Add this line for debugging
        res.json(investor);
    } catch (error) {
        console.error('Error retrieving investor:', error);
        res.status(500).send('Error retrieving investor');
    }
});

// Update investor details by ID
app.put('/investor/:id', async (req, res) => {
    try {
        const investorId = req.body._id;
        const updates = req.body;
        const updatedInvestor = await Investor.findByIdAndUpdate(investorId, updates, { new: true });
        if (!updatedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(updatedInvestor);
    } catch (error) {
        console.error('Error updating investor:', error);
        res.status(500).send('Error updating investor');
    }
});

// Delete investor by ID
app.delete('/investor/:id', async (req, res) => {
    try {
        const investorId = req.body._id;
        const deletedInvestor = await Investor.findByIdAndRemove(investorId);
        if (!deletedInvestor) {
            return res.status(404).send('Investor not found');
        }
        res.json(deletedInvestor);
    } catch (error) {
        console.error('Error deleting investor:', error);
        res.status(500).send('Error deleting investor');
    }
});



// // Asset Routes

// Real World Assets Routes
app.post('/asset/register', (req, res) => {
    // Register asset and return DID
});

app.post('/asset/storeData', (req, res) => {
    // Store asset data and return CID
});


app.post('/asset/tokenize', async (req, res) => {
    try {
        // Get data from the request
        const { DIDs, CIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, BBWalletAddress } = req.body;

        if (!DIDs || !CIDs || !revenueGoals || !name || !symbol || !revenueShare || !contractTerm || !maxTokenSupply || !tokenPrice || !BBWalletAddress) {
            return res.status(400).send('Missing required parameters.');
        }

        // Deploy the ServiceContract and get its address
        const serviceContractAddress = await deployServiceContract(GSCAddress);

        // Deploy the TokenContract using the ServiceContract's address
        const tokenContractAddress = await deployTokenContract(DIDs, CIDs, revenueGoals, name, symbol, revenueShare, contractTerm, maxTokenSupply, tokenPrice, serviceContractAddress);

        // Deploy LiquidityContract
        const liquidityContractAddress = await deployLiquidityContract(serviceContractAddress, BBWalletAddress, MASTER_ADDRESS);

        // Deploy RevenueDistributionContract
        const revenueDistributionContractAddress = await deployRevenueDistributionContract(serviceContractAddress, tokenContractAddress, liquidityContractAddress);


        // Get SC ABI
        const contractPath = path.join(SCBuild);
        const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const SCABI = contractJSON.abi;

        // Create a ServiceContract instance
        const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);


        // Call setTokenContract with gas estimation and send
        await estimateAndSend(ServiceContract.methods.setContractAddresses(tokenContractAddress, liquidityContractAddress, revenueDistributionContractAddress), MASTER_ADDRESS, serviceContractAddress);

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



app.post('/asset/connectRevenueStream', (req, res) => {
    // Deploy revenue stream contract and connect to tokenization engine
});

app.get('/asset/:did', (req, res) => {
    // Retrieve asset details
});

app.put('/asset/:did', (req, res) => {
    // Update asset details
});

app.delete('/asset/:id', (req, res) => {
    // Delete asset
});



// // Transactions Routes (Nice to have for book keeping & analytics)

app.post('/transactions', (req, res) => {
    // Log a new transaction
});

app.get('/transactions', (req, res) => {
    // Retrieve all transactions
});

app.get('/transactions/:id', (req, res) => {
    // Retrieve specific transaction
});

app.get('/transactions/user/:userId', (req, res) => {
    // Retrieve all transactions for a specific user
});


// // // EXPORT
module.exports = { app, Company, Investor };
