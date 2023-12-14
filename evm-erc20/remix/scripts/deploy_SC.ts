// This script can be used to deploy the "Storage" contract using ethers.js library.
// Please make sure to compile "./contracts/1_Storage.sol" file before running this script.
// And use Right click -> "Run" from context menu of the file to run the script. Shortcut: Ctrl+Shift+S

import { deploy } from './ethers-lib'
import { ethers } from 'ethers'


async function main() {
    try {
        // Deploy ServiceContract
        const serviceContractResult = await deploy('ServiceContract', [
            '0xa4a860b91d78a6e1509cf46e39134ffc0f33470c',
        ])
        console.log(`ServiceContract address: ${serviceContractResult.address}`)

        const serviceContractAddress = serviceContractResult.address

        // Define TokenContractERC20 constructor arguments
        const constructorArgs = {
            penomoWallet: '0x3FDD79F8e2222bCC78eEF4cd19FAa200E051F9E8',
            globalStateAddress: '0xa4a860b91d78a6e1509cf46e39134ffc0f33470c',
            serviceContractAddress: serviceContractAddress,
            name: 'PENOMO-BAT-1',
            symbol: 'PENOMO-BAT-1',
            revenueShare: 10000n,
            maxTokenSupply: 1000000000000000000000000n,
            tokenPrice: 1000000000000000n,
            currency: "USDC"
        }

        // Deploy TokenContractERC20
        const tokenContractERC20Result = await deploy('TokenContractERC20', [
            constructorArgs,
            [12345],
            [67890],
            [1],
        ])
        console.log(
            `TokenContractERC20 address: ${tokenContractERC20Result.address}`,
        )

        const tokenContractERC20Address = tokenContractERC20Result.address

        // Deploy LiquidityContract
        const liquidityContractResult = await deploy('LiquidityContract', [
            serviceContractAddress,
            '0xB54700EF83f29bB918615F31fdB58D3F33Ebd6C7',
            '0x3FDD79F8e2222bCC78eEF4cd19FAa200E051F9E8',
        ])
        console.log(
            `LiquidityContract address: ${liquidityContractResult.address}`,
        )

        const liquidityContractAddress = liquidityContractResult.address

        // Deploy RevenueDistributionContract
        const revenueDistributionResult = await deploy(
            'RevenueDistributionContract',
            [
                serviceContractAddress,
                tokenContractERC20Address,
                liquidityContractAddress,
            ],
        )
        console.log(
            `RevenueDistributionContract address: ${revenueDistributionResult.address}`,
        )

        const revenueDistributionContractAddress =
            revenueDistributionResult.address

        console.log(`"${tokenContractERC20Address}", "${liquidityContractAddress}", "${revenueDistributionContractAddress}"`);

    } catch (e) {
        console.log(e.message)
    }
}

main()
