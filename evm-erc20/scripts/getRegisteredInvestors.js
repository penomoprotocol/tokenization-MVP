// scripts/getRegisteredInvestors.js

const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // Replace with your deployed contract address
    const GLOBAL_STATE_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const GlobalStateContract = await hre.ethers.getContractAt("GlobalStateContract", GLOBAL_STATE_CONTRACT_ADDRESS, deployer);

    // Fetch the registered investors
    const registeredInvestorsCount = await GlobalStateContract.registeredInvestors.length;
    let registeredInvestors = [];

    for (let i = 0; i < registeredInvestorsCount; i++) {
        const investorAddress = await GlobalStateContract.registeredInvestors(i);
        registeredInvestors.push(investorAddress);
    }

    console.log("Registered Investors:", registeredInvestors);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
