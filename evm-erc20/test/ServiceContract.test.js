const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ServiceContract", function () {
    let owner, investor, revenueSimulator, globalState, tokenERC20, serviceContract, liquidityContract, revenueDistributionContract;

    beforeEach(async function () {
        [owner, investor, revenueSimulator] = await ethers.getSigners();

        // Deploy GlobalStateContract
        const GlobalState = await ethers.getContractFactory("GlobalStateContract");
        globalState = await GlobalState.deploy(500);

        // Register the investor
        await globalState.registerInvestor(investor.address);

        // Deploy TokenContractERC20
        const TokenERC20 = await ethers.getContractFactory("TokenContractERC20");
        tokenERC20 = await TokenERC20.deploy(globalState.target, "Token Name", "TKN", 1000, 2, 1000000, 10, [], [], []);

        // Deploy ServiceContract
        const Service = await ethers.getContractFactory("ServiceContract");
        serviceContract = await Service.deploy(tokenERC20.target, globalState.target, 5000);

        // Deploy LiquidityContract and RevenueDistributionContract for testing
        const Liquidity = await ethers.getContractFactory("LiquidityContract");
        liquidityContract = await Liquidity.deploy(serviceContract.target, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy(serviceContract.target, tokenERC20.target);

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setLiquidityContract(liquidityContract.target);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);
    });



    it("should allow an investor to buy tokens", async function () {
        const amount = 10n; // Using BigInt
        const tokenPrice = BigInt(await tokenERC20.tokenPrice()); // Convert to BigInt
        const requiredEther = amount * tokenPrice; // Use BigInt multiplication

        await expect(serviceContract.connect(investor).buyTokens(amount, {
            value: requiredEther
        })).to.emit(serviceContract, "TokensPurchased").withArgs(investor.address, amount);
    
    });

    it("should send funds to RevenueDistributionContract and LiquidityContract when receiving funds from revenue simulator", async function () {
        const sentAmount = BigInt(ethers.utils.parseEther("1").toString()); // Convert to BigInt
        await revenueSimulator.sendTransaction({
            to: serviceContract.address,
            value: sentAmount.toString() // Convert BigInt to string for transaction
        });

        expect(BigInt(await ethers.provider.getBalance(revenueDistributionContract.address))).to.be.gt(0n); // Convert to BigInt for comparison
        expect(BigInt(await ethers.provider.getBalance(liquidityContract.address))).to.be.gt(0n); // Convert to BigInt for comparison
    });

    it("should allow the owner to withdraw accumulated fees", async function () {
        const initialBalance = BigInt(await ethers.provider.getBalance(owner.address)); // Convert to BigInt
        await serviceContract.withdraw();
        const finalBalance = BigInt(await ethers.provider.getBalance(owner.address)); // Convert to BigInt

        expect(finalBalance).to.be.gt(initialBalance); // Use BigInt comparison
    });


    it("should not allow non-owners to withdraw accumulated fees", async function () {
        await expect(serviceContract.connect(investor).withdraw()).to.be.revertedWith("Only the owner can execute this");
    });

});