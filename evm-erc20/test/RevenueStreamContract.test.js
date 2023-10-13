const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Revenue Stream Contract", function () {
    let owner, BB, RI, URI, RSC, penomoWallet, battery1, battery2, globalState, tokenERC20, serviceContract;

    beforeEach(async function () {
        [owner, BB, RI, URI, RSC, penomoWallet, battery1, battery2] = await ethers.getSigners();

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
        liquidityContract = await Liquidity.deploy(serviceContract.target, owner.address, BB.address);

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy(serviceContract.target, tokenERC20.target, liquidityContract.target);

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setTokenContract(tokenERC20.target);
        await serviceContract.setLiquidityContract(liquidityContract.target);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);

        // Deploy LiquidityContract and RevenueDistributionContract
        const RevenueStream = await ethers.getContractFactory("RevenueStreamContract");
        revenueStreamContract = await RevenueStream.deploy(serviceContract.target, 1n/100n); // 0.01 ether per kWh
    });


    it("should allow owner to start and stop the rental", async function () {
        await revenueStreamContract.startRental(1000n); // Start with 1000 kWh
        expect(await revenueStreamContract.isRentalActive()).to.equal(true);

        // Simulate battery sending kWh data
        await revenueStreamContract.authorizeBattery(battery1.address);
        await revenueStreamContract.connect(battery1).updateKWhReading(1100n); // 100 kWh used

        await revenueStreamContract.stopRental();
        expect(await revenueStreamContract.isRentalActive()).to.equal(false);

        const serviceContractBalance = await ethers.provider.getBalance(serviceContract.target);
        expect(serviceContractBalance).to.equal(1n/10n); // 100 kWh * 0.01 ether/kWh * 10% penomofee  = 0.1 ether
    });

    it("should only allow authorized batteries to update kWh readings", async function () {
        await revenueStreamContract.startRental(1000);

        await expect(revenueStreamContract.connect(battery1).updateKWhReading(1100))
            .to.be.revertedWith("Not an authorized battery");

        await revenueStreamContract.authorizeBattery(battery1.address);
        await revenueStreamContract.connect(battery1).updateKWhReading(1100); // Should not revert now

        await revenueStreamContract.revokeBatteryAuthorization(battery1.address);
        await expect(revenueStreamContract.connect(battery1).updateKWhReading(1200))
            .to.be.revertedWith("Not an authorized battery");
    });

    it("should not allow updating kWh reading if rental is not active", async function () {
        await revenueStreamContract.authorizeBattery(battery1.address);
        await expect(revenueStreamContract.connect(battery1).updateKWhReading(1100))
            .to.be.revertedWith("Rental is not active");
    });

    it("should not allow starting the rental if it's already active", async function () {
        await revenueStreamContract.startRental(1000);
        await expect(revenueStreamContract.startRental(1100))
            .to.be.revertedWith("Rental is already active");
    });

    it("should not allow stopping the rental if it's not active", async function () {
        await expect(revenueStreamContract.stopRental())
            .to.be.revertedWith("Rental is not active");
    });
});
