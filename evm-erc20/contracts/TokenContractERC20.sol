// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./GlobalStateContract.sol"; // Import the GlobalStateContract for the whitelist check

contract TokenContractERC20 is ERC20 {
    uint256 public revenueShare; // in basis points (e.g., 500 for 5%)
    uint256 public contractTerm; // in months
    uint256 public maxTokenSupply;
    uint256 public tokenPrice; // in wei
    GlobalStateContract public globalState;

    struct Battery {
        string DID;
        string CID;
        uint256 revenueGoal;
    }
    Battery[] public batteries;
    address[] public tokenHolders;

    constructor(
        address _globalStateAddress,
        string memory _name,
        string memory _symbol,
        uint256 _revenueShare,
        uint256 _contractTerm,
        uint256 _maxTokenSupply,
        uint256 _tokenPrice,
        string[] memory DIDs,
        string[] memory CIDs,
        uint256[] memory revenueGoals
    ) ERC20(_name, _symbol) {
        globalState = GlobalStateContract(_globalStateAddress);
        revenueShare = _revenueShare;
        contractTerm = _contractTerm;
        maxTokenSupply = _maxTokenSupply;
        tokenPrice = _tokenPrice;

        for(uint i = 0; i < DIDs.length; i++) {
            Battery memory newBattery = Battery({
                DID: DIDs[i],
                CID: CIDs[i],
                revenueGoal: revenueGoals[i]
            });
            batteries.push(newBattery);
        }

        // Mint the maximum supply of tokens to the contract's address upon construction
        _mint(address(this), maxTokenSupply);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        require(globalState.isRegisteredInvestor(to), "Recipient is not whitelisted");
        
        // If the recipient is not already a token holder, add them to the list
        if (!isTokenHolder(to) && to != address(0)) { // address(0) check is to ensure the zero address is not added
            tokenHolders.push(to);
        }

        // If a token holder's balance drops to zero, remove them from the list
        if (balanceOf(from) == 0 && from != address(0)) {
            uint256 indexToRemove = findIndex(from);
            address lastAddress = tokenHolders[tokenHolders.length - 1];
            tokenHolders[indexToRemove] = lastAddress;
            tokenHolders.pop();
        }
    }

    function isTokenHolder(address _address) internal view returns (bool) {
        for (uint256 i = 0; i < tokenHolders.length; i++) {
            if (tokenHolders[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function findIndex(address _address) internal view returns (uint256) {
        for (uint256 i = 0; i < tokenHolders.length; i++) {
            if (tokenHolders[i] == _address) {
                return i;
            }
        }
        revert("Address not found");
    }

    // Function to return the list of token holders
    function getTokenHolders() external view returns (address[] memory) {
        return tokenHolders;
    }
 
    // Function to give service contract allowance of erc20 tokens in this contract
    function approveServiceContract(address serviceContractAddress) external {
    uint256 balance = balanceOf(address(this));
    approve(serviceContractAddress, balance);
}



    // Additional functions for battery data, revenue share, etc.
    // ...
}
