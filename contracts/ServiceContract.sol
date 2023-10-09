// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenContractERC20.sol";
import "./LiquidityContract.sol";
import "./RevenueDistributionContract.sol";
import "./GlobalStateContract.sol";

contract ServiceContract {
    address public owner;
    TokenContract public tokenContract;
    LiquidityContract public liquidityContract;
    RevenueDistributionContract public revenueDistributionContract;
    GlobalStateContract public globalState;
    uint256 public revenueSharePercentage;

    event TokensPurchased(address indexed investor, uint256 amount);
    event ReceivedFundsFromRevenueReceiver(address indexed from, uint256 amount);

    constructor(
        address _tokenContractAddress, 
        address _liquidityContractAddress, 
        address _revenueDistributionContractAddress, 
        address _globalStateAddress,
        uint256 _revenueSharePercentage
    ) {
        owner = msg.sender;
        tokenContract = TokenContract(_tokenContractAddress);
        liquidityContract = LiquidityContract(_liquidityContractAddress);
        revenueDistributionContract = RevenueDistributionContract(_revenueDistributionContractAddress);
        globalState = GlobalStateContract(_globalStateAddress);
        revenueSharePercentage = _revenueSharePercentage;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function buyTokens(uint256 amount) public payable {
        // Check if the investor is registered in the GlobalStateContract
        require(globalState.isRegisteredInvestor(msg.sender), "Investor is not registered");

        // Ensure the correct amount of ether is sent
        uint256 requiredEther = amount * tokenContract.tokenPrice();
        require(msg.value == requiredEther, "Incorrect Ether sent");

        // Transfer the tokens to the investor
        tokenContract.transfer(msg.sender, amount);

        // Calculate Penomo's fee from the GlobalStateContract and the amount to send to the LiquidityContract
        uint256 feeAmount = (msg.value * globalState.penomoFee()) / 10000;
        uint256 liquidityAmount = msg.value - feeAmount;

        // Send the funds to the LiquidityContract
        payable(address(liquidityContract)).transfer(liquidityAmount);

        emit TokensPurchased(msg.sender, amount);
    }

    function receiveFundsFromRevenueStream() external payable {
        // Calculate the amount after deducting Penomo's fee
        uint256 amountAfterFee = (msg.value * (10000 - globalState.penomoFee())) / 10000;

        // Calculate the amount to send to RevenueDistributionContract based on revenueSharePercentage
        uint256 amountForRDC = (amountAfterFee * revenueSharePercentage) / 10000;

        // Calculate the amount to send to the LiquidityContract
        uint256 amountForLC = amountAfterFee - amountForRDC;

        // Send the funds
        payable(address(revenueDistributionContract)).transfer(amountForRDC);
        payable(address(liquidityContract)).transfer(amountForLC);

        emit ReceivedFundsFromRevenueReceiver(msg.sender, msg.value);
    }

    // Allows the owner to withdraw the accumulated Ether (Penomo's fees)
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
