# Tokenization Smart Contracts
This repository contains a set of smart contracts for tokenizing assets, specifically focusing on battery assets. The contracts are written in Solidity and are designed to be deployed on the Ethereum blockchain.

# Overview

The system consists of several contracts:
GlobalStateContract: Manages global parameters like fees and registered investors.
TokenContractERC20: Represents the tokenized asset and includes functionalities like buying tokens.
LiquidityContract: Manages liquidity and related operations.
RevenueDistributionContract: Distributes revenue among token holders.
ServiceContract: Acts as the main entry point for users to interact with the system.
RevenueStreamContract: Represents a revenue stream.

# Local Deployment with Hardhat

## Prerequisites
Node.js and npm installed.
Hardhat and necessary dependencies installed.

## Steps

Clone the Repository:
git clone [REPO_URL]
cd [REPO_DIRECTORY]

Install Dependencies:
npm install

Compile the Contracts:
npx hardhat compile

In a separate teminal start the hardhat node:
npx hardhat node --network hardhat

Deploy the Contracts Locally:
npx hardhat run scripts/deploy.js --network hardhat

## Interact with the Contracts:

After deployment, you can use Hardhat tasks or the Hardhat console to interact with your deployed contracts:

bash
Copy code
npx hardhat console --network hardhat

## Testing (Optional):

If tests are available, run them using:

bash
Copy code
npx hardhat test

## Notes

Hardhat will automatically create a local Ethereum environment for you, with several accounts pre-funded with Ether.
Make sure to adjust gas prices and limits as necessary, depending on the Ethereum network's conditions.