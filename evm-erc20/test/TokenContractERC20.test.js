const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenContractERC20", function () {
    let owner, BB, RI, URI, RSC, penomoWallet, globalState, tokenERC20, serviceContract;

    beforeEach(async function () {
        [owner, BB, RI, URI, RSC, penomoWallet] = await ethers.getSigners();

        // Deploy GlobalStateContract
        const GlobalState = await ethers.getContractFactory("GlobalStateContract");
        globalState = await GlobalState.deploy(1000);

        // Register the RI
        await globalState.registerInvestor(RI.address);

        // Deploy ServiceContract
        const Service = await ethers.getContractFactory("ServiceContract");
        serviceContract = await Service.deploy(globalState.target, 5000);

        // Deploy TokenContractERC20
        const TokenERC20 = await ethers.getContractFactory("TokenContractERC20");
        const constructorArgs = {
            penomoWallet: penomoWallet.address,
            globalStateAddress: globalState.target,
            serviceContractAddress: serviceContract.target,
            name: "Battery Uno",
            symbol: "UNO",
            revenueShare: 1000,
            contractTerm: 12,
            maxTokenSupply: 1000000,
            tokenPrice: 1
        };
        tokenERC20 = await TokenERC20.deploy(constructorArgs, [], [], []);

        // Deploy LiquidityContract and RevenueDistributionContract
        const Liquidity = await ethers.getContractFactory("LiquidityContract");
        liquidityContract = await Liquidity.deploy(serviceContract.target, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy(serviceContract.target, tokenERC20.target);

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setTokenContract(tokenERC20.target);
        await serviceContract.setLiquidityContract(liquidityContract.target);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);
    });

    it("should mint the defined maximum supply upon construction", async function () {
        const balance = await tokenERC20.balanceOf(tokenERC20.target);
        const maxTokenSupply = await tokenERC20.maxTokenSupply()
        expect(balance).to.equal(maxTokenSupply);
    });

    it("should allow a registered RI to buy tokens", async function () {
        const amount = 100n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = amount * tokenPrice;

        // Assuming the buyTokens function is in the ServiceContract
        await serviceContract.connect(RI).buyTokens(amount, {
            value: requiredEther
        });

        const balance = await tokenERC20.balanceOf(RI.address);
        console.log("RI Token Balance: ", balance);
        expect(balance).to.equal(amount);

        const isTokenHolder = await tokenERC20.isTokenHolder(RI.address);
        const tokenHolders = await tokenERC20.getTokenHolders();
        console.log("RI wallet in isTokenHolder list: ", isTokenHolder);
        expect(isTokenHolder).to.be.true;
    });

    it("should not allow an unregistered RI to buy tokens", async function () {
        const amount = 100n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = amount * tokenPrice;

        await expect(
            serviceContract.connect(URI).buyTokens(amount, {
                value: requiredEther
            })
        ).to.be.revertedWith("Recipient is not whitelisted as registered investor.");


    });

    it("should  allow RI to transfer token to registered RI", async function () {

        // Register URI
        await globalState.registerInvestor(URI.address);

        // First, let's make sure RI has some tokens to transfer
        const initialAmount = 100n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = initialAmount * tokenPrice;

        await serviceContract.connect(RI).buyTokens(initialAmount, {
            value: requiredEther
        });

        const balanceBeforeTransfer = await tokenERC20.balanceOf(RI.address);
        expect(balanceBeforeTransfer).to.equal(initialAmount);

        // Try to transfer tokens to the unregistered RI
        const transferAmount = 50n;
        await expect(
            tokenERC20.connect(RI).transfer(URI.address, transferAmount)
        ).to.not.be.revertedWith("Recipient is not whitelisted as registered investor.");

        // Check that the balance of RI hasn't changed
        const balanceAfterAttemptedTransferRegistered = await tokenERC20.balanceOf(RI.address);
        const balanceAfterAttemptedTransferUnregistered = await tokenERC20.balanceOf(URI.address);

        console.log("Balance registered RI: ", balanceAfterAttemptedTransferRegistered);
        console.log("Balance unregistered RI: ", balanceAfterAttemptedTransferUnregistered);

        expect(balanceAfterAttemptedTransferRegistered).to.equal(balanceAfterAttemptedTransferUnregistered);

    });

    it("should not allow RI to transfer token to unregistered RI", async function () {
        // First, let's make sure RI has some tokens to transfer
        const initialAmount = 100n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = initialAmount * tokenPrice;

        await serviceContract.connect(RI).buyTokens(initialAmount, {
            value: requiredEther
        });

        const balanceBeforeTransfer = await tokenERC20.balanceOf(RI.address);
        expect(balanceBeforeTransfer).to.equal(initialAmount);

        // Try to transfer tokens to the unregistered RI
        const transferAmount = 50n;
        await expect(
            tokenERC20.connect(RI).transfer(URI.address, transferAmount)
        ).to.be.revertedWith("Recipient is not whitelisted as registered investor.");

        // Check that the balance of RI hasn't changed
        const balanceAfterAttemptedTransferRegistered = await tokenERC20.balanceOf(RI.address);
        const balanceAfterAttemptedTransferUnregistered = await tokenERC20.balanceOf(URI.address);

        console.log("Balance registered RI: ", balanceAfterAttemptedTransferRegistered);
        console.log("Balance unregistered RI: ", balanceAfterAttemptedTransferUnregistered);

        expect(balanceAfterAttemptedTransferRegistered).to.equal(initialAmount);

    });


    it("penomoWallet should be able to force transfer tokens from RI", async function () {
        // First, let's make sure RI has some tokens to transfer
        const initialAmount = 100n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = initialAmount * tokenPrice;

        await serviceContract.connect(RI).buyTokens(initialAmount, {
            value: requiredEther
        });

        // Assuming there's a forceTransfer function in the TokenContractERC20
        const amount = 50n;
        await tokenERC20.connect(penomoWallet).forceTransfer(RI.address, penomoWallet.address, amount);

        const balanceRI = await tokenERC20.balanceOf(RI.address);
        expect(balanceRI).to.equal(50n);

        const balancePenomo = await tokenERC20.balanceOf(penomoWallet.address);
        expect(balancePenomo).to.equal(50n);
    });


});

