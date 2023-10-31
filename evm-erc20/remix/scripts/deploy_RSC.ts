// This script can be used to deploy the "Storage" contract using ethers.js library.
// Please make sure to compile "./contracts/1_Storage.sol" file before running this script.
// And use Right click -> "Run" from context menu of the file to run the script. Shortcut: Ctrl+Shift+S

import { deploy } from './ethers-lib'
import { ethers } from 'ethers';




(async () => {
  try {
    const result = await deploy("RevenueStreamContract", ["0x65f6871D2A42ecb8C9ce1fa3D989ad9c89738131", 100000000000000n])
    console.log(`address: ${result.address}`)
  } catch (e) {
    console.log(e.message)
  }
})()