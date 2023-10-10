// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  // Deploying GlobalStateContract
  const GlobalStateContract = await ethers.getContractFactory("GlobalStateContract");
  console.log(GlobalStateContract);
  const globalStateContract = await GlobalStateContract.deploy(500);
  await globalStateContract.waitForDeployment();
  console.log(globalStateContract);
  
  
  console.log("GlobalStateContract deployed to:", globalStateContract.address);


  // Deploying TokenContractERC20
  const TokenContractERC20 = await ethers.getContractFactory("TokenContractERC20");
  const tokenContractERC20 = await TokenContractERC20.deploy(
    globalStateContract.address,
    "Battery X",
    "BX",
    7500,
    12,
    100000,
    10,
    ["DID123"],
    ["CID456"],
    [1000]
  );
  await tokenContractERC20.deployed();
  console.log("TokenContractERC20 deployed to:", tokenContractERC20.address);

  // Deploying ServiceContract
  const ServiceContract = await ethers.getContractFactory("ServiceContract");
  const serviceContract = await ServiceContract.deploy(
    tokenContractERC20.address,
    globalStateContract.address,
    7500
  );
  await serviceContract.deployTransaction.wait();
  console.log("ServiceContract deployed to:", serviceContract.address);

  // Deploying LiquidityContract.sol
  const LiquidityContract = await ethers.getContractFactory("LiquidityContract");
  const liquidityContract = await LiquidityContract.deploy(serviceContract.address, "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("LiquidityContract deployed to:", liquidityContract.address);

  // Deploying RevenueDistributionContract
  const RevenueDistributionContract = await ethers.getContractFactory("RevenueDistributionContract");
  const revenueDistributionContract = await RevenueDistributionContract.deploy(serviceContract.address, tokenContractERC20.address);
  console.log("RevenueDistributionContract deployed to:", revenueDistributionContract.address);

  // Deploying RevenueStreamContract
  const RevenueStreamContract = await ethers.getContractFactory("RevenueStreamContract");
  const revenueStreamContract = await RevenueStreamContract.deploy(serviceContract.address, 200);
  console.log("RevenueStreamContract deployed to:", revenueStreamContract.address);

  // Set addresses for LiquidityContract and RevenueDistributionContract in ServiceContract
  await serviceContract.setLiquidityContract(liquidityContract.address);
  console.log("LiquidityContract address set in ServiceContract.");

  await serviceContract.setRevenueDistributionContract(revenueDistributionContract.address);
  console.log("RevenueDistributionContract address set in ServiceContract.");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
