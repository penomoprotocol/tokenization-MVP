// This script can be used to deploy the "Storage" contract using ethers.js library.
// Please make sure to compile "./contracts/1_Storage.sol" file before running this script.
// And use Right click -> "Run" from context menu of the file to run the script. Shortcut: Ctrl+Shift+S

import { deploy } from './ethers-lib'
import { ethers } from 'ethers';




(async () => {
  try {
    const result = await deploy("LiquidityContract", ["0x2843EE6Cf531F61a94f924b179FF3c4994EED358", "0xB54700EF83f29bB918615F31fdB58D3F33Ebd6C7", "0x3FDD79F8e2222bCC78eEF4cd19FAa200E051F9E8"])
    console.log(`address: ${result.address}`)
  } catch (e) {
    console.log(e.message)
  }
})()