// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TokenContractERC20.sol"; // Import the previously defined token contract

contract RevenueDistributionContract {
    address public serviceContract; // Address of the ServiceContract
    TokenContractERC20 public tokenContractERC20; // Instance of the token contract

    // Events
    event ReceivedFunds(address indexed from, uint256 amount);
    event DistributedRevenue(address indexed to, uint256 amount);

    constructor(address _serviceContract, address _tokenContractERC20) {
        serviceContract = _serviceContract;
        tokenContractERC20 = TokenContractERC20(_tokenContractERC20);
    }

    // Modifier to ensure only the ServiceContract can send funds
    modifier onlyServiceContract() {
        require(msg.sender == serviceContract, "Only the ServiceContract can send funds");
        _;
    }

    // Function to receive funds from the ServiceContract
    function receiveFunds() external payable onlyServiceContract {
        emit ReceivedFunds(msg.sender, msg.value);
        // distributeRevenue();
    }
    

    // Function to distribute revenue among token holders
    function distributeRevenue() internal {
        uint256 totalSupply = tokenContractERC20.totalSupply();
        require(totalSupply > 0, "No tokens in circulation");

        address[] memory tokenHolders = tokenContractERC20.getTokenHolders();
        for (uint256 i = 0; i < tokenHolders.length; i++) {
            address holder = tokenHolders[i];
            uint256 holderBalance = tokenContractERC20.balanceOf(holder);
            uint256 holderShare = (address(this).balance * holderBalance) / totalSupply;
            payable(holder).transfer(holderShare);
            emit DistributedRevenue(holder, holderShare);
        }
    }

    // Function to check the balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
