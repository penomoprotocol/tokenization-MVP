# Tokenization Smart Contracts

This repository contains a set of smart contracts for tokenizing assets, specifically focusing on battery assets. The contracts are written in Solidity and are designed to be deployed on peaq network via the evm-bridge.

## Overview

The system consists of several contracts:

- **GlobalStateContract**: Manages global parameters like fees and registered investors.
- **TokenContractERC20**: Represents the tokenized asset and includes functionalities like buying tokens.
- **LiquidityContract**: Manages liquidity and related operations.
- **RevenueDistributionContract**: Distributes revenue among token holders.
- **ServiceContract**: Acts as the main entry point for users to interact with the system.
- **RevenueStreamContract**: Represents a revenue stream.

## Local Deployment with Hardhat

### Prerequisites

- Node.js and npm installed.
- Hardhat and necessary dependencies installed.

### Steps

1. **Clone the Repository**:
   ```bash
   git clone [REPO_URL]
   cd [REPO_DIRECTORY]

2. **Install Dependencies**:
   ```bash
   npm install

3. **Compile the Contracts**:
   ```bash
   npx hardhat compile

4. **Start the Hardhat Node (in a separate terminal)**:
   ```bash
   npx hardhat node --network hardhat
5. **Deploy the Contracts Locally**:
   ```bash
   npx hardhat run scripts/deploy.js --network hardhat
6. **Interact with the Contracts**:
   After deployment, you can use Hardhat tasks or the Hardhat console to interact with your deployed contracts:
   ```bash
   npx hardhat console --network hardhat
7. **Testing**:
   If tests are available, run them using:
   ```bash
   npx hardhat test

### Notes
For testing in local environment, Hardhat will automatically create a local Ethereum environment for you, with several accounts pre-funded with Ether.