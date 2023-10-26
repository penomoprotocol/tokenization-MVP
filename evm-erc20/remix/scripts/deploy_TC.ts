// This script can be used to deploy the "Storage" contract using ethers.js library.
// Please make sure to compile "./contracts/1_Storage.sol" file before running this script.
// And use Right click -> "Run" from context menu of the file to run the script. Shortcut: Ctrl+Shift+S

import { deploy } from './ethers-lib'
import { ethers } from 'ethers';


const constructorArgs = {
  penomoWallet: "0x3FDD79F8e2222bCC78eEF4cd19FAa200E051F9E8",
  globalStateAddress: "0x13AaF783107aA2116c2A4279948868791c5C67f1",
  serviceContractAddress: "0x2843EE6Cf531F61a94f924b179FF3c4994EED358",
  name: "Battery Uno",
  symbol: "UNO",
  revenueShare: 5000,
  contractTerm: 12,
  maxTokenSupply: 1000,
  tokenPrice: ethers.utils.parseEther("0.01")
};

(async () => {
  try {
    const result = await deploy("TokenContractERC20", [constructorArgs, [12345], [67890], [1]])
    console.log(`address: ${result.address}`)
  } catch (e) {
    console.log(e.message)
  }
})()