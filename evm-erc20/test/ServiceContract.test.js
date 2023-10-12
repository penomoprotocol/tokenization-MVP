const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ServiceContract", function () {
    let owner, investor, revenueSimulator, globalState, tokenERC20, serviceContract, liquidityContract, revenueDistributionContract;

    beforeEach(async function () {
        [owner, investor, revenueSimulator] = await ethers.getSigners();

        // Deploy GlobalStateContract
        const GlobalState = await ethers.getContractFactory("GlobalStateContract");
        globalState = await GlobalState.deploy(1000);

        // Register the investor
        await globalState.registerInvestor(investor.address);

        // Deploy ServiceContract
        const Service = await ethers.getContractFactory("ServiceContract");
        serviceContract = await Service.deploy(globalState.target, 5000);

        // Deploy TokenContractERC20
        const TokenERC20 = await ethers.getContractFactory("TokenContractERC20");
        tokenERC20 = await TokenERC20.deploy(globalState.target, serviceContract.target, "Battery Uno", "UNO", 1000, 12, 1000000, 1, [], [], []);

        // Deploy LiquidityContract and RevenueDistributionContract
        const Liquidity = await ethers.getContractFactory("LiquidityContract");
        liquidityContract = await Liquidity.deploy(serviceContract.target, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

        const RevenueDistribution = await ethers.getContractFactory("RevenueDistributionContract");
        revenueDistributionContract = await RevenueDistribution.deploy(serviceContract.target, tokenERC20.target);

        // Set LiquidityContract and RevenueDistributionContract in ServiceContract
        await serviceContract.setTokenContract(tokenERC20.target);  
        await serviceContract.setLiquidityContract(liquidityContract.target);
        await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);


        // Log Receipt
        // const receipt = await tx.wait();
        // console.log(receipt);

        // Logging for debugging
        // const allowance = await tokenERC20.allowance(tokenERC20.target, serviceContract.target);
        // console.log(serviceContract.target);
        // console.log(allowance);




    });


    it("should allow an investor to buy tokens", async function () {
        const amount = 100n; // Using BigInt
        const tokenPrice = BigInt(await tokenERC20.tokenPrice()); // Convert to BigInt
        const requiredEther = amount * tokenPrice; // Use BigInt multiplication


        const allowance = await tokenERC20.allowance(tokenERC20.target, serviceContract.target);
        await expect(serviceContract.connect(investor).buyTokens(amount, {
            value: requiredEther
        })).to.emit(serviceContract, "TokensPurchased").withArgs(investor.address, amount);
        const serviceBalance = await serviceContract.getBalance();
        const liquidityBalance = await liquidityContract.getBalance();
        console.log("Service Contract Balance: ", serviceBalance, "Liquidity Contract Balance: ", liquidityBalance);revenueDistributionContract
        
    });

    it("should send funds to RevenueDistributionContract and LiquidityContract when receiving funds from revenue simulator", async function () {
        const sentAmount = 100n; // Convert to BigInt
        await serviceContract.connect(revenueSimulator).receiveFundsFromRevenueStream({
            value: sentAmount
        });
        
        const liquidityBalance = await liquidityContract.getBalance();
        const revenueBalance = await revenueDistributionContract.getBalance();
        const serviceBalance = await serviceContract.getBalance();
        console.log("Service Contract Balance: ", serviceBalance, "Liquidity Contract Balance: ", liquidityBalance, "Revenue Distribution Contract Balance: ", revenueBalance);

        expect(BigInt(await ethers.provider.getBalance(liquidityContract.target))).to.be.gt(0n); // Convert to BigInt for comparison
        expect(BigInt(await ethers.provider.getBalance(revenueDistributionContract.target))).to.be.gt(0n); // Convert to BigInt for comparison
        
    });

    it("should allow the owner to withdraw accumulated fees", async function () {
        const sentAmount = 100n; // Convert to BigInt
        const sentAmountWei = sentAmount * 10n**18n; // Convert to BigInt
        await serviceContract.connect(revenueSimulator).receiveFundsFromRevenueStream({
            value: sentAmountWei
        });
        const initialBalance = BigInt(await ethers.provider.getBalance(owner.address));
        await serviceContract.withdraw();
        const finalBalance = BigInt(await ethers.provider.getBalance(owner.address)); // Convert to BigInt

        expect(finalBalance).to.be.gt(initialBalance); // Use BigInt comparison
    });


    it("should not allow non-owners to withdraw accumulated fees", async function () {
        await expect(serviceContract.connect(investor).withdraw()).to.be.revertedWith("Only the owner can execute this");
    });

});