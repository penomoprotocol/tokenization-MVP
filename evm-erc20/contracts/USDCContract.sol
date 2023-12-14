// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCContract is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1e9 * (10 ** 18); // 1 billion tokens with 18 decimal places

    constructor(address ownerAddress) ERC20("USDC Token", "USDC") {
        // Mint the initial supply to the contract creator
        _mint(msg.sender, INITIAL_SUPPLY);

        // Set the allowance for the ownerAddress
        _approve(msg.sender, ownerAddress, INITIAL_SUPPLY);
    }
}
