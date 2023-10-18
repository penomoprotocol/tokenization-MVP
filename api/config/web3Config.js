

const {Web3} = require('web3');

// Replace with your Ethereum provider URL
const providerUrl = 'https://ethereum-sepolia.publicnode.com';

const networkId = 11155111;

const gasPrice = '20000000000';

const web3 = new Web3(providerUrl);


module.exports = {
  web3,
  networkId,
  gasPrice,
};
