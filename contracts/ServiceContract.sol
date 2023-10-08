pragma solidity ^0.8.0;

import "./TokenContract.sol"; // Import the token contract
import "./LiquidityContract.sol"; // Import the liquidity contract
import "./RevenueDistributionContract.sol"; // Import the revenue contract

contract ServiceContract {
    address public owner; // Penomo platform's address
    address[] public registeredInvestors; // Whitelist of registered investors
    TokenContract public tokenContract; // Reference to the token contract
    LiquidityContract public liquidityContract; // Reference to the liquidity contract
    RevenueDistributionContract public revenueDistributionContract; // Reference to the revenue contract
    uint256 public penomoFee; // Penomo fee in basis points (e.g., 500 for 5%)
    uint256 public revenueSharePercentage; // Revenue share percentage in basis points (e.g., 5000 for 50%)

    // Event to log the purchase of tokens
    event TokensPurchased(address indexed investor, uint256 amount);
    event ReceivedFundsFromRevenueReceiver(address indexed from, uint256 amount);

    constructor(
        address _tokenContractAddress, 
        address _liquidityContractAddress, 
        address _revenueDistributionContractAddress, 
        uint256 _penomoFee,
        uint256 _revenueSharePercentage
    ) {
        owner = msg.sender;
        tokenContract = TokenContract(_tokenContractAddress);
        liquidityContract = LiquidityContract(_liquidityContractAddress);
        revenueDistributionContract = RevenueDistributionContract(_revenueDistributionContractAddress);
        penomoFee = _penomoFee;
        revenueSharePercentage = _revenueSharePercentage;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function registerInvestor(address investor) public onlyOwner {
        // Ensure the investor isn't already registered
        require(!isRegisteredInvestor(investor), "Investor is already registered");
        registeredInvestors.push(investor);
    }

    function buyTokens(uint256 amount) public payable {
        // Check if the investor is registered
        require(isRegisteredInvestor(msg.sender), "Investor is not registered");

        // Ensure the correct amount of ether is sent
        uint256 requiredEther = amount * tokenContract.tokenPrice();
        require(msg.value == requiredEther, "Incorrect Ether sent");

        // Transfer the tokens to the investor
        tokenContract.transfer(msg.sender, amount);

        // Calculate Penomo's fee and the amount to send to the LiquidityContract
        uint256 feeAmount = (msg.value * penomoFee) / 10000;
        uint256 liquidityAmount = msg.value - feeAmount;

        // Send the funds to the LiquidityContract
        payable(address(liquidityContract)).transfer(liquidityAmount);

        emit TokensPurchased(msg.sender, amount);
    }

    function receiveFundsFromRevenueStream() external payable {
        // Calculate the amount to send to RevenueDistributionContract based on revenueSharePercentage
        uint256 amountForRDC = (msg.value * revenueSharePercentage) / 10000;
        
        // Calculate Penomo's fee and the amount to send to the LiquidityContract
        uint256 feeAmount = (msg.value * penomoFee) / 10000;
        uint256 liquidityAmount = msg.value - amountForRDC - feeAmount;

        // Send the funds
        payable(address(revenueDistributionContract)).transfer(amountForRDC);
        payable(address(liquidityContract)).transfer(liquidityAmount);

        emit ReceivedFundsFromRevenueReceiver(msg.sender, msg.value);
    }

    function isRegisteredInvestor(address investor) public view returns(bool) {
        for(uint i = 0; i < registeredInvestors.length; i++) {
            if(registeredInvestors[i] == investor) {
                return true;
            }
        }
        return false;
    }

    // Allows the owner to withdraw the accumulated Ether (Penomo's fees)
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
