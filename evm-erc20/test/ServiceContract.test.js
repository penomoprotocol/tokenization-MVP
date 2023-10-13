const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Service Contract", function () {
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
            maxTokenSupply: 1000000,
            tokenPrice: 1
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
    });


    it("should allow an RI to buy tokens", async function () {
        const amount = 100n; // Using BigInt
        const tokenPrice = BigInt(await tokenERC20.tokenPrice()); // Convert to BigInt
        const requiredEther = amount * tokenPrice; // Use BigInt multiplication


        const allowance = await tokenERC20.allowance(tokenERC20.target, serviceContract.target);
        await expect(serviceContract.connect(RI).buyTokens(amount, {
            value: requiredEther
        })).to.emit(serviceContract, "TokensPurchased").withArgs(RI.address, amount);
        const serviceBalance = await serviceContract.getBalance();
        const liquidityBalance = await liquidityContract.getBalance();
        //console.log("Service Contract Balance: ", serviceBalance, "Liquidity Contract Balance: ", liquidityBalance);revenueDistributionContract

    });

    it("should send funds to RDC and LC when receiving funds from RSC", async function () {
        const sentAmount = 100n; // Convert to BigInt
        await serviceContract.connect(RSC).receiveFundsFromRevenueStream({
            value: sentAmount
        });

        const liquidityBalance = await liquidityContract.getBalance();
        const revenueBalance = await revenueDistributionContract.getBalance();
        const serviceBalance = await serviceContract.getBalance();
        //console.log("Service Contract Balance: ", serviceBalance, "Liquidity Contract Balance: ", liquidityBalance, "Revenue Distribution Contract Balance: ", revenueBalance);

        expect(BigInt(await ethers.provider.getBalance(liquidityContract.target))).to.be.gt(0n); // Convert to BigInt for comparison
        expect(BigInt(await ethers.provider.getBalance(revenueDistributionContract.target))).to.be.gt(0n); // Convert to BigInt for comparison

    });

    it("should allow the owner to withdraw accumulated fees", async function () {
        const sentAmount = 100n; // Convert to BigInt
        const sentAmountWei = sentAmount * 10n ** 18n; // Convert to BigInt
        await serviceContract.connect(RSC).receiveFundsFromRevenueStream({
            value: sentAmountWei
        });
        const initialBalance = BigInt(await ethers.provider.getBalance(owner.address));
        await serviceContract.withdraw();
        const finalBalance = BigInt(await ethers.provider.getBalance(owner.address)); // Convert to BigInt

        expect(finalBalance).to.be.gt(initialBalance); // Use BigInt comparison
    });

    it("should not allow non-owners to withdraw accumulated fees", async function () {
        await expect(serviceContract.connect(RI).withdraw()).to.be.revertedWith("Only the owner can execute this");
    });

});