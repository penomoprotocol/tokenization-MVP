

const {Web3} = require('web3');

// Replace with your Ethereum provider URL
const providerUrl = 'https://ethereum-sepolia.publicnode.com';

const networkId = 11155111;

const web3 = new Web3(providerUrl);


// Global State Contract Address
const GSCAddress = '0x13AaF783107aA2116c2A4279948868791c5C67f1';

module.exports = {
  web3,
  networkId,
  GSCAddress
};
