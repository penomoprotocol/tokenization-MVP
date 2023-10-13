const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Liquidity Contract", function () {
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
        liquidityContract = await Liquidity.deploy(serviceContract.target, owner.address, BB.address);

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy(serviceContract.target, tokenERC20.target, liquidityContract.target);

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setTokenContract(tokenERC20.target);
        await serviceContract.setLiquidityContract(liquidityContract.target);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);
    });



    it("should allow BBWallet and owner to withdraw funds", async function () {
        // Send some funds to the LiquidityContract
        await liquidityContract.connect(owner).receiveFunds({ value: 2n });

        // BBWallet withdraws 1 ether
        await liquidityContract.connect(BB).withdrawFunds(1n);
        const balanceAfterBBWithdraw = await liquidityContract.getBalance();
        expect(balanceAfterBBWithdraw).to.equal(1n);

        // PenomoWallet withdraws 1 ether
        await liquidityContract.connect(owner).withdrawFunds(1n);
        const balanceAfterPenomoWithdraw = await liquidityContract.getBalance();
        expect(balanceAfterPenomoWithdraw).to.equal(0);
    });

    it("should not allow other addresses to withdraw funds", async function () {
        // Send some funds to the LiquidityContract
        await liquidityContract.connect(RI).receiveFunds({ value: 1n});

        // Attempt withdrawal from a non-owner address
        await expect(liquidityContract.connect(RI).withdrawFunds(1n))
            .to.be.revertedWith("Only the BBWallet or PenomoWallet can withdraw funds");
    });

    it("should not allow withdrawal of more funds than available", async function () {
        // Send some funds to the LiquidityContract
        await liquidityContract.connect(owner).receiveFunds({ value: 1n });

        // Attempt to withdraw more than the available balance
        await expect(liquidityContract.connect(BB).withdrawFunds(2n))
            .to.be.revertedWith("Insufficient funds in the contract");
    });
});
