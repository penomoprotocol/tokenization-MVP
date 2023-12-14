const {Web3} = require('web3');

// Replace with your Ethereum provider URL
const providerUrl = 'https://rpcpc1-qa.agung.peaq.network';

const networkId = 9990;

const web3 = new Web3(providerUrl);

// Global State Contract Address
const GSCAddress = '0xa4a860b91d78a6e1509cf46e39134ffc0f33470c';

// Mock USDC Contract Address
const USDCContractAddress = '0xb82dd712bd19e29347ee01f6678296b5f3c8cf03';

module.exports = {
  web3,
  networkId,
  GSCAddress,
  USDCContractAddress
};
