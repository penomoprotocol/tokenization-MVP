const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Revenue Distribtion Contract", function () {
    let owner, BB, RI1, RI2, RI3, URI, RSC, penomoWallet, globalState, tokenERC20, serviceContract;

    beforeEach(async function () {
        [owner, BB, RI1, RI2, RI3, URI, RSC, penomoWallet] = await ethers.getSigners();

        // Deploy GlobalStateContract
        const GlobalState = await ethers.getContractFactory("GlobalStateContract");
        globalState = await GlobalState.deploy(1000);

        // Register the RI
        await globalState.registerInvestor(RI1.address);
        await globalState.registerInvestor(RI2.address);
        await globalState.registerInvestor(RI3.address);

        // Deploy ServiceContract
        const Service = await ethers.getContractFactory("ServiceContract");
        serviceContract = await Service.deploy(globalState.target);

        // Deploy TokenContractERC20
        const TokenERC20 = await ethers.getContractFactory("TokenContractERC20");
        const constructorArgs = {
            penomoWallet: penomoWallet.address,
            globalStateAddress: globalState.target,
            serviceContractAddress: serviceContract.target,
            name: "Battery Uno",
            symbol: "UNO",
            revenueShare: 5000,
            contractTerm: 12,
            maxTokenSupply: 100,
            tokenPrice: 10n ** 18n
        };
        tokenERC20 = await TokenERC20.deploy(constructorArgs, [], [], []);

        // Deploy LiquidityContract and RevenueDistributionContract
        const Liquidity = await ethers.getContractFactory("LiquidityContract");
        liquidityContract = await Liquidity.deploy(serviceContract.target, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy(serviceContract.target, tokenERC20.target, liquidityContract.target);

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setTokenContract(tokenERC20.target);
        await serviceContract.setLiquidityContract(liquidityContract.target);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);


        const amount = 10n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = amount * tokenPrice;
        await serviceContract.connect(RI1).buyTokens(amount, {
            value: requiredEther
        });

        await serviceContract.connect(RI2).buyTokens(2n * amount, {
            value: 2n * requiredEther
        });

        await serviceContract.connect(RI3).buyTokens(5n * amount, {
            value: 5n * requiredEther
        });

        const balance1 = await tokenERC20.balanceOf(RI1.address);
        const balance2 = await tokenERC20.balanceOf(RI2.address);
        const balance3 = await tokenERC20.balanceOf(RI3.address);

        //console.log("token balance1: ", balance1);
        //console.log("token balance2: ", balance2);
        //console.log("token balance3: ", balance3);

    });

    it("should distribute revenue among token holders", async function () {

        const LCBalance1 = await liquidityContract.getBalance();
        //console.log("liquidityBalance1: ", LCBalance1);

        const tokenHolders = await tokenERC20.getTokenHolders();
        //console.log(tokenHolders);

        const initialBalanceRI1 = await ethers.provider.getBalance(RI1.address);
        const initialBalanceRI2 = await ethers.provider.getBalance(RI2.address);
        const initialBalanceRI3 = await ethers.provider.getBalance(RI3.address);

        // Send funds from RSC to SC
        const sentAmount = 100n * 10n ** 18n; // Convert to BigInt
        await serviceContract.connect(RSC).receiveFundsFromRevenueStream({
            value: sentAmount
        });
        //console.log("Sent amount: ", sentAmount / 10n ** 17n);

        // Wait for the revenue to be distributed
        await ethers.provider.send("evm_increaseTime", [5]); // Increase time by 5 seconds
        await ethers.provider.send("evm_mine"); // Mine a new block

        // Check new balances
        const newBalanceRI1 = await ethers.provider.getBalance(RI1.address);
        const newBalanceRI2 = await ethers.provider.getBalance(RI2.address);
        const newBalanceRI3 = await ethers.provider.getBalance(RI3.address);


        const LCBalance2 = await liquidityContract.getBalance();
        //console.log("LCBalance2-LCBalance1: ", (LCBalance2 - LCBalance1) / 10n ** 17n);
   
        const RDCBalance = await revenueDistributionContract.getBalance();
        //console.log("RDCBalance: ", RDCBalance / 10n ** 17n);

        //console.log((newBalanceRI1 - initialBalanceRI1) / 10n ** 17n, (newBalanceRI2 - initialBalanceRI2) / 10n ** 17n, (newBalanceRI3 - initialBalanceRI3) / 10n ** 17n);
        //console.log((newBalanceRI1 - initialBalanceRI1) / 10n ** 17n + (newBalanceRI2 - initialBalanceRI2) / 10n ** 17n + (newBalanceRI3 - initialBalanceRI3) / 10n ** 17n - sentAmount / 10n ** 17n  * 9n / 10n / 2n);

        expect((newBalanceRI2 - initialBalanceRI2) / (newBalanceRI1 - initialBalanceRI1)).to.eq(2n);
        expect((newBalanceRI3 - initialBalanceRI3) / (newBalanceRI1 - initialBalanceRI1)).to.eq(5n);
    });

    it("should distribute all funds received from the ServiceContract", async function () {
        const initialBalance = await revenueDistributionContract.getBalance();
        expect(initialBalance).to.equal(0);

        const sentAmount = 100n; // Convert to BigInt
        await serviceContract.connect(RSC).receiveFundsFromRevenueStream({
            value: sentAmount
        });

        const newBalance = await revenueDistributionContract.getBalance();
        expect(newBalance).to.equal(0n);
    });
});
