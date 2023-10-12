const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenContractERC20", function () {
    let owner, RI, penomoWallet, globalState, tokenERC20, serviceContract;

    beforeEach(async function () {
        [owner, RI, penomoWallet] = await ethers.getSigners();

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
        tokenERC20 = await TokenERC20.deploy(
            globalState.target, 
            serviceContract.target, 
            "Battery Uno", 
            "UNO", 
            1000, 
            12, 
            1000000, 
            1n*10n**18n, 
            [], 
            [], 
            []);

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
        console.log("RI Token Balance: ",balance);
        expect(balance).to.equal(amount);
        
        const isTokenHolder = await tokenERC20.isTokenHolder(RI.address);
        const tokenHolders = await tokenERC20.getTokenHolders();
        console.log("RI wallet in isTokenHolder list: ", isTokenHolder);
        expect(isTokenHolder).to.be.true;
    });

    it("should not allow an unregistered RI to buy tokens", async function () {
        const unregisteredRI = ethers.Wallet.createRandom();
        const amount = 100n;
        const tokenPrice = BigInt(await tokenERC20.tokenPrice());
        const requiredEther = amount * tokenPrice;

        await expect(
            serviceContract.connect(unregisteredRI).buyTokens(amount, {
                value: requiredEther
            })
        ).to.be.revertedWith("Recipient is not whitelisted");
    });

    it("penomoWallet should be able to force transfer tokens from RI", async function () {
        // Assuming there's a forceTransfer function in the TokenContractERC20
        const amount = 50n;
        await tokenERC20.connect(penomoWallet).forceTransfer(RI.address, penomoWallet.address, amount);

        const balanceRI = await tokenERC20.balanceOf(RI.address);
        expect(balanceRI).to.equal(50n);

        const balancePenomo = await tokenERC20.balanceOf(penomoWallet.address);
        expect(balancePenomo).to.equal(50n);
    });

    // Add other tests as needed...
});

