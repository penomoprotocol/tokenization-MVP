const express = require('express');
const app = express.Router();

/**
 * @swagger
 * /investor/register:
 *   post:
 *     summary: Register an investor
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered investor.
 *       500:
 *         description: Error registering investor.
 */

// Investor Registration
app.post('/investor/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new Ethereum wallet and get the private key
        const wallet = createWallet();
        const privateKey = wallet.privateKey;
        console.log("Original privateKey: ", privateKey);
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

/**
 * @swagger
 * /investor/login:
 *   post:
 *     summary: Login an investor
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

/**
 * @swagger
 * /investor/verify:
 *   post:
 *     summary: Verify an investor's KYC on the blockchain
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               investorWalletAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Investor successfully verified.
 *       500:
 *         description: An error occurred or transaction failed.
 */

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

/**
 * @swagger
 * /investor/buyToken:
 *   post:
 *     summary: Investor buys tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully bought tokens.
 *       500:
 *         description: Error buying tokens.
 */

// Handle investor token purchase
app.post('/investor/buyToken', async (req, res) => {
    try {
        const { investorId, password, tokenAmount, serviceContractAddress } = req.body;

        if (!serviceContractAddress) {
            return res.status(400).send('Missing service contract address.');
        }

        // Step 1: Get the investor from the database using the provided investorId
        const investor = await Investor.findById(investorId);
        if (!investor) {
            console.log('Investor not found:', investorId);
            return res.status(401).send('Investor not found');
        }

        // Step 2: Verify password
        const isPasswordValid = await bcrypt.compare(password, investor.password);
        if (!isPasswordValid) {
            console.log('Invalid credentials for investor ID:', investorId);
            return res.status(401).send('Invalid credentials');
        }

        console.log("investor.ethereumPublicKey: ", investor.ethereumPublicKey);

        // Step 3: Decrypt the private key
        const decryptedPrivateKey = decryptPrivateKey(investor.ethereumPrivateKey, SECRET_KEY);
        console.log("decryptedPrivateKey: ", decryptedPrivateKey);

        // The rest of the code remains the same for processing the transaction...
        const SCcontractPath = path.join(SCBuild);
        const SCcontractJSON = JSON.parse(fs.readFileSync(SCcontractPath, 'utf8'));
        const SCABI = SCcontractJSON.abi;

        // Get TC ABI
        const TCcontractPath = path.join(TCBuild);
        const TCcontractJSON = JSON.parse(fs.readFileSync(TCcontractPath, 'utf8'));
        const TCABI = TCcontractJSON.abi;

        const ServiceContract = new web3.eth.Contract(SCABI, serviceContractAddress);

        const tokenContractERC20Address = await ServiceContract.methods.tokenContractERC20().call();
        const tokenContractInstance = new web3.eth.Contract(TCABI, tokenContractERC20Address);
        const tokenPrice = await tokenContractInstance.methods.tokenPrice().call();

        //const tokenPrice = await ServiceContract.methods.tokenContractERC20().methods.tokenPrice().call();

        const requiredWei = BigInt(tokenPrice) * BigInt(tokenAmount);

        const txData = {
            to: serviceContractAddress,
            data: ServiceContract.methods.buyTokens(tokenAmount * 10 ** 18).encodeABI(),
            value: requiredWei.toString(),
            gasPrice: await web3.eth.getGasPrice(),
            nonce: await web3.eth.getTransactionCount(investor.ethereumPublicKey)  // Use the public key (wallet address) of the investor
        };

        txData.gas = await web3.eth.estimateGas(txData);
        const signedTx = await web3.eth.accounts.signTransaction(txData, decryptedPrivateKey);
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.status(200).json({ txHash: txReceipt.transactionHash });

    } catch (error) {
        console.error('Error purchasing tokens:', error);
        res.status(500).send('Failed to purchase the tokens.');
    }
});

/**
 * @swagger
 * /investor/sellToken:
 *   post:
 *     summary: Investor sells tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully sold tokens.
 *       500:
 *         description: Error selling tokens.
 */

// Handle investor token sell
app.post('/investor/sellToken', (req, res) => {
    // Sell token via orderbook (has priority over tokens held by contract)
    // -> indicate amount to sell 
    // -> creates listing in SC (mapping of address -> amount)
    // -> gives allowance over amount to SC
    // -> If somebody wants to buy a token, first check open listings from other investors
});

/**
 * @swagger
 * /investor/{id}:
 *   get:
 *     summary: Retrieve investor details by ID
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

/**
 * @swagger
 * /investor/{id}:
 *   put:
 *     summary: Update investor details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the investor to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Details of the updated investor.
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
 *         description: Error updating investor.
 */

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

/**
 * @swagger
 * /investor/{id}:
 *   delete:
 *     summary: Delete investor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the investor to delete.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Details of the deleted investor.
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
 *         description: Error deleting investor.
 */

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


module.exports = app;
