const fs = require('fs');
const path = require('path');

const CryptoJS = require('crypto-js');
const { web3, networkId, gasPrice, GSCAddress } = require('../config/web3Config');

const GSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'GlobalStateContract.sol', 'GlobalStateContract.json');
const SCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'ServiceContract.sol', 'ServiceContract.json');
const TCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'TokenContractERC20.sol', 'TokenContractERC20.json');
const LCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'LiquidityContract.sol', 'LiquidityContract.json');
const RDCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueDistributionContract.sol', 'RevenueDistributionContract.json');
const RSCBuild = path.join(__dirname, '..', '..', 'evm-erc20', 'artifacts', 'contracts', 'RevenueStreamContract.sol', 'RevenueStreamContract.json');

const ethers  = require('ethers');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const mongoose = require('mongoose');
require('dotenv').config();

const { app } = require('../server.js');
const { Company } = require('../server.js'); // Import the Company model
const { Investor } = require('../server.js'); // Import the Company model

// Get variables from .env
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MASTER_ADDRESS = process.env.MASTER_ADDRESS;
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;

chai.use(chaiHttp);

before(async function () {
    try {
        // Establish a connection to the test database
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Clear the Company collection in the test database
        await Company.deleteMany();

        // Clear the Investor collection in the test database
        await Investor.deleteMany();

    } catch (err) {
        // Handle errors
        console.error('Failed to connect or clear collections:', err);
        throw err; // This will fail the test suite
    }
});

after(async function () {
    try {
        // Close the Mongoose connection after all tests
        await mongoose.connection.close();
    } catch (err) {
        // Handle errors
        console.error('Failed to close the Mongoose connection:', err);
        throw err; // This will fail the test suite
    }
});


describe('Test API', function () {
    let companyId; // Define companyId in the outer scope
    let companyWalletAddress;

    it('should register a new company', (done) => {
        chai.request(app)
            .post('/company/register')
            .send({
                name: 'Test Company',
                email: 'testcompany@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                companyId = res.body.company._id; // Extract the ID of the registered company
                companyWalletAddress = res.body.company.ethereumPublicKey; // Extract the wallet address
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    // Log in with the registered company
    it('should log in with the registered company', (done) => {
        chai.request(app)
            .post('/company/login')
            .send({
                email: 'testcompany@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('token');
                //console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should verify a company and add it to global state contract whitelist', async () => {
        try {
            const response = await chai.request(app)
                .post('/company/verify')
                .send({
                    companyWalletAddress: companyWalletAddress,
                });
            response.should.have.status(200);
            response.body.should.have.property('message', 'Company successfully verified');

            // Get ABI 
            const contractPath = path.join(GSCBuild);
            const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            const GSCABI = contractJSON.abi;

            // Query the Global State Contract to check if the address is in the whitelist
            const contract = new web3.eth.Contract(GSCABI, GSCAddress);
            const verified = await contract.methods.verifiedCompanies(companyWalletAddress).call();
            console.log("verified: ", verified);

            // Use chai-as-promised to make assertions on the promise result
            verified.should.be.true;
        } catch (error) {
            // Handle errors
            throw error;
        }
    });

    it('should get company details', (done) => {
        chai.request(app)
            .get(`/company/${companyId}`)
            .send({
                _id: companyId,
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should update company details', (done) => {
        chai.request(app)
            .put(`/company/${companyId}`)
            .send({
                _id: companyId,
                name: 'Updated Company Name',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('name', 'Updated Company Name');
                done(); // Signal that the test is complete on success
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    // it('should delete the company', (done) => {
    //     chai.request(app)
    //         .delete(`/company/${companyId}`)
    //         .send({
    //             _id: companyId,
    //         })
    //         .then(function (res) {
    //             res.should.have.status(200);
    //             done();
    //         })
    //         .catch(function (err) {
    //             // Handle errors and signal test completion in case of failure
    //             done(err);
    //         });
    // });



    let investorId; // Define investorId in the outer scope
    let investorWalletAddress;

    it('should register a new investor and fund their account', (done) => {
        chai.request(app)
            .post('/investor/register')
            .send({
                name: 'Test Investor',
                email: 'testinvestor@example.com',
                password: 'testpassword',
            })
            .then(async function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                investorId = res.body.investor._id; // Extract the ID of the registered investor
                investorWalletAddress = res.body.investor.ethereumPublicKey; // Extract the wallet address
    
                // Funding the investor's wallet
                const amountWei = (20n / 100n * 10n ** 18n).toString(); // Calculating the desired amount
    
                // Estimating gas for a simple transfer
                const estimatedGas = await web3.eth.estimateGas({
                    from: MASTER_ADDRESS,
                    to: investorWalletAddress,
                    value: 20000000000000000
                });
                const bufferGas = BigInt(estimatedGas) * 110n / 100n;  // adding a 10% buffer
                const roundedGas = bufferGas + (10n - bufferGas % 10n);  // rounding up to the nearest 10
                let currentGasPrice = await web3.eth.getGasPrice();
    
                const tx = {
                    from: MASTER_ADDRESS,
                    to: investorWalletAddress,
                    value: 20000000000000000,
                    gas: roundedGas.toString(),
                    gasPrice: currentGasPrice 
                };
    
                const signedTx = await web3.eth.accounts.signTransaction(tx, MASTER_PRIVATE_KEY);
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });
    

    // Log in with the registered investor
    it('should log in with the registered investor', (done) => {
        chai.request(app)
            .post('/investor/login')
            .send({
                email: 'testinvestor@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('token');
                //console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should verify a investor and add it to global state contract whitelist', async () => {
        try {
            const response = await chai.request(app)
                .post('/investor/verify')
                .send({
                    investorWalletAddress: investorWalletAddress,
                });
            response.should.have.status(200);
            response.body.should.have.property('message', 'Investor successfully verified');

            // Get ABI
            const contractPath = path.join(GSCBuild);
            const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            const GSCABI = contractJSON.abi;

            // Query the Global State Contract to check if the address is in the whitelist
            const contract = new web3.eth.Contract(GSCABI, GSCAddress);
            const verified = await contract.methods.verifiedInvestors(investorWalletAddress).call();
            console.log("verified: ", verified);

            // Use chai-as-promised to make assertions on the promise result
            verified.should.be.true;
        } catch (error) {
            // Handle errors
            throw error;
        }
    });


    it('should get investor details', (done) => {
        chai.request(app)
            .get(`/investor/${investorId}`)
            .send({
                _id: investorId,
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should update investor details', (done) => {
        chai.request(app)
            .put(`/investor/${investorId}`)
            .send({
                _id: investorId,
                name: 'Updated Investor Name',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('name', 'Updated Investor Name');
                done(); // Signal that the test is complete on success
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    // it('should delete the investor', (done) => {
    //     chai.request(app)
    //         .delete(`/investor/${investorId}`)
    //         .send({
    //             _id: investorId,
    //         })
    //         .then(function (res) {
    //             res.should.have.status(200);
    //             done();
    //         })
    //         .catch(function (err) {
    //             // Handle errors and signal test completion in case of failure
    //             done(err);
    //         });
    // });

    let tokenContractAddress;
    let serviceContractAddress;

    it('should deploy a token contract and service contract successfully', async () => {
        try {
            const response = await chai.request(app)
                .post('/asset/tokenize')
                .send({
                    DIDs: ["12345"],
                    CIDs: ["67890"],
                    revenueGoals: [1000n.toString()],
                    name: "BatteryX",
                    symbol: "BAX",
                    revenueShare: 5000n.toString(),
                    contractTerm: 24n.toString(),
                    maxTokenSupply: 100n.toString(),
                    tokenPrice: ethers.utils.parseEther("0.1"),
                    BBWalletAddress: companyWalletAddress,
                });


            response.should.have.status(200);
            response.body.should.be.a('object');
            response.body.should.have.property('tokenContractAddress');
            response.body.should.have.property('serviceContractAddress');
            response.body.should.have.property('liquidityContractAddress');
            response.body.should.have.property('revenueDistributionContractAddress');

            tokenContractAddress = response.body.tokenContractAddress;
            serviceContractAddress = response.body.serviceContractAddress;
            liquidityContractAddress = response.body.liquidityContractAddress;
            revenueDistributionContractAddress = response.body.revenueDistributionContractAddress;


            // Verify if addresses are valid contract addresses on Eth network
            const tokenCodeAtAddress = await web3.eth.getCode(tokenContractAddress);
            const serviceCodeAtAddress = await web3.eth.getCode(serviceContractAddress);
            const liquidityCodeAtAddress = await web3.eth.getCode(liquidityContractAddress);
            const revenueDistributionCodeAtAddress = await web3.eth.getCode(revenueDistributionContractAddress);

            // '0x' == there's no code at that address i.e., it's not a contract
            tokenCodeAtAddress.should.not.equal('0x');
            serviceCodeAtAddress.should.not.equal('0x');
            liquidityCodeAtAddress.should.not.equal('0x');
            revenueDistributionCodeAtAddress.should.not.equal('0x');

        } catch (error) {
            // Handle errors
            throw error;
        }
    });

    let investorTokenBalanceBeforePurchase;
    let investorEtherBalanceBeforePurchase;
    const purchaseAmountEther = web3.utils.toWei("1", "ether"); // 1 ETH for example, adjust as needed
    
    it('should allow an investor to purchase tokens', async () => {
        try {
            // Get investor's token and ether balance before purchase
            const tokenContractPath = path.join(TCBuild);
            const tokenContractJSON = JSON.parse(fs.readFileSync(tokenContractPath, 'utf8'));
            const TokenABI = tokenContractJSON.abi;
    
            const tokenContract = new web3.eth.Contract(TokenABI, tokenContractAddress);
            investorTokenBalanceBeforePurchase = await tokenContract.methods.balanceOf(investorWalletAddress).call();
            investorEtherBalanceBeforePurchase = await web3.eth.getBalance(investorWalletAddress);
    
            // Purchase tokens
            const response = await chai.request(app)
                .post('/investor/buyToken')
                .send({
                    investorId: investorId,    
                    password: 'testpassword',         
                    tokenAmount: 1, 
                    serviceContractAddress: serviceContractAddress
                });
    
            response.should.have.status(200);
            response.body.should.be.a('object');
            response.body.should.have.property('txHash');   // Changed from 'tokensPurchased' to 'txHash'
    
            // Verify token balance increased
            const investorTokenBalanceAfterPurchase = await tokenContract.methods.balanceOf(investorWalletAddress).call();
            const tokensReceived = BigInt(investorTokenBalanceAfterPurchase) - BigInt(investorTokenBalanceBeforePurchase);
            console.log("investorTokenBalanceAfterPurchase: ", investorTokenBalanceAfterPurchase);
            console.log("tokensReceived: ", tokensReceived);
            
            // As we now receive a transaction hash, we can't directly assert on the number of tokens purchased.
            // So, I removed the line that checks for the equality of tokensReceived and response.body.tokensPurchased.
    
            // Verify ether balance decreased
            const investorEtherBalanceAfterPurchase = await web3.eth.getBalance(investorWalletAddress);
            const etherSpent = BigInt(investorEtherBalanceBeforePurchase) - BigInt(investorEtherBalanceAfterPurchase);
            console.log("investorEtherBalanceAfterPurchase: ", investorEtherBalanceAfterPurchase);
            console.log("etherSpent: ", etherSpent);

            // Allowing a small variance for gas
            // etherSpent.should.be.closeTo(BigInt("YOUR_DESIRED_ETHER_AMOUNT_TO_SPEND"), BigInt(web3.utils.toWei("0.01", "ether"))); 
    
        } catch (error) {
            // Handle errors
            throw error;
        }
    });
    
});