//THis file is used when we are testing using the Sepolia Test Net

const {Web3} = require('web3');

// Replace with your Ethereum provider URL
const providerUrl = 'https://ethereum-sepolia.publicnode.com';

const networkId = 11155111;

const web3 = new Web3(providerUrl);

// Global State Contract Address
const GSCAddress = '0xeEBac63d9393ba35B2031E2081A7FB10A5197773';

// Mock USDC Contract Address
const USDCContractAddress = '0xD0A0D62413cB0577B2B9a52CA8b05C03bb56ccE8';

module.exports = {
  web3,
  networkId,
  GSCAddress,
  USDCContractAddress
};
