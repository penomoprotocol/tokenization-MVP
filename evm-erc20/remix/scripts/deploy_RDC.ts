// This script can be used to deploy the "Storage" contract using ethers.js library.
// Please make sure to compile "./contracts/1_Storage.sol" file before running this script.
// And use Right click -> "Run" from context menu of the file to run the script. Shortcut: Ctrl+Shift+S

import { deploy } from './ethers-lib'
import { ethers } from 'ethers';




(async () => {
  try {
    const result = await deploy("RevenueDistributionContract", ["0x2843EE6Cf531F61a94f924b179FF3c4994EED358", "0x0F52babB4B3720987eDb54F93A93E45FC488E0Ac", "0x6Fd40F411A3d76F313b376D8bF7125e0FAbEDE0c"])
    console.log(`address: ${result.address}`)
  } catch (e) {
    console.log(e.message)
  }
})()