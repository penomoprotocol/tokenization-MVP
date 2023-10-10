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
        tokenERC20 = await TokenERC20.deploy("Token Name", "TKN", 1000, 2, 1000000, 10, [], [], []);

        // Deploy ServiceContract
        const Service = await ethers.getContractFactory("ServiceContract");
        serviceContract = await Service.deploy(tokenERC20.address, globalState.address, 5000);

        // Deploy LiquidityContract and RevenueDistributionContract for testing
        const Liquidity = await ethers.getContractFactory("LiquidityContract");
        liquidityContract = await Liquidity.deploy();

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy();

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setLiquidityContract(liquidityContract.address);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.address);
    });

    it("should allow an investor to buy tokens", async function () {
        const amount = 10;
        const tokenPrice = await tokenERC20.tokenPrice();
        const requiredEther = amount * tokenPrice;

        await expect(investor.sendTransaction({
            to: serviceContract.address,
            value: requiredEther
        })).to.emit(serviceContract, "TokensPurchased").withArgs(investor.address, amount);
    });

    it("should send funds to RevenueDistributionContract and LiquidityContract when receiving funds from revenue simulator", async function () {
        const sentAmount = ethers.utils.parseEther("1");
        await revenueSimulator.sendTransaction({
            to: serviceContract.address,
            value: sentAmount
        });

        expect(await ethers.provider.getBalance(revenueDistributionContract.address)).to.be.gt(0);
        expect(await ethers.provider.getBalance(liquidityContract.address)).to.be.gt(0);
    });

    it("should allow the owner to withdraw accumulated fees", async function () {
        const initialBalance = await owner.getBalance();
        await serviceContract.withdraw();
        const finalBalance = await owner.getBalance();

        expect(finalBalance).to.be.gt(initialBalance);
    });

    it("should not allow non-owners to withdraw accumulated fees", async function () {
        await expect(serviceContract.connect(investor).withdraw()).to.be.revertedWith("Only the owner can execute this");
    });
});
