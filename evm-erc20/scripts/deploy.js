// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  // Deploy GlobalStateContract
  const GlobalStateContract = await hre.ethers.getContractFactory("GlobalStateContract");
  const globalStateContract = await GlobalStateContract.deploy(500);
  await globalStateContract.waitForDeployment(); 
  console.log(`deployed to ${globalStateContract.target}`);


  // Deploy TokenContract
  const TokenContractERC20 = await hre.ethers.getContractFactory("TokenContractERC20");
  const tokenContractERC20 = await TokenContractERC20.deploy(
    globalStateContract.target,
    "Battery X",
    "BX",
    7500,
    12,
    100000,
    10,
    ["DID123"],
    ["CID456"],
    [1000]);
  await tokenContractERC20.waitForDeployment();
  console.log(`deployed to ${tokenContractERC20.target}`);


  // Deploying ServiceContract
  const ServiceContract = await hre.ethers.getContractFactory("ServiceContract");
  const serviceContract = await ServiceContract.deploy(
    tokenContractERC20.target,
    globalStateContract.target,
    7500
  );
  await serviceContract.waitForDeployment(); 
  console.log(`deployed to ${serviceContract.target}`);


  // Deploying LiquidityContract.sol
  const LiquidityContract = await hre.ethers.getContractFactory("LiquidityContract");
  const liquidityContract = await LiquidityContract.deploy(serviceContract.target, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await liquidityContract.waitForDeployment(); 
  console.log(`deployed to ${liquidityContract.target}`);


  // Deploying RevenueDistributionContract.sol
  const RevenueDistributionContract = await hre.ethers.getContractFactory("RevenueDistributionContract");
  const revenueDistributionContract = await RevenueDistributionContract.deploy(serviceContract.target, tokenContractERC20.target);
  await revenueDistributionContract.waitForDeployment(); 
  console.log(`deployed to ${revenueDistributionContract.target}`);


  // Deploying RevenueStreamContract.sol
  const RevenueStreamContract = await hre.ethers.getContractFactory("RevenueStreamContract");
  const revenueStreamContract = await RevenueStreamContract.deploy(serviceContract.target, 200);
  await revenueStreamContract.waitForDeployment(); 
  console.log(`deployed to ${revenueStreamContract.target}`);

  // Set addresses for LiquidityContract and RevenueDistributionContract in ServiceContract
  await serviceContract.setLiquidityContract(liquidityContract.target);
  console.log("LiquidityContract address set in ServiceContract.");

  await serviceContract.setRevenueDistributionContract(revenueDistributionContract.target);
  console.log("RevenueDistributionContract address set in ServiceContract.");


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
