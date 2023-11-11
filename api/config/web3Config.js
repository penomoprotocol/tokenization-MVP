

const {Web3} = require('web3');

// Replace with your Ethereum provider URL
const providerUrl = 'https://ethereum-sepolia.publicnode.com';

const networkId = 11155111;

const web3 = new Web3(providerUrl);


// Global State Contract Address
const GSCAddress = '0xeEBac63d9393ba35B2031E2081A7FB10A5197773';

module.exports = {
  web3,
  networkId,
  GSCAddress
};
