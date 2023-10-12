// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TokenContractERC20.sol";
import "./LiquidityContract.sol";
import "./RevenueDistributionContract.sol";
import "./GlobalStateContract.sol";

contract ServiceContract {
    address public owner;
    TokenContractERC20 public tokenContractERC20;
    LiquidityContract public liquidityContract;
    RevenueDistributionContract public revenueDistributionContract;
    GlobalStateContract public globalState;
    uint256 public revenueSharePercentage;

    event TokensPurchased(address indexed investor, uint256 amount);
    event ReceivedFundsFromRevenueStream(address indexed from, uint256 amount);

    constructor(address _globalStateAddress, uint256 _revenueSharePercentage) {
        owner = msg.sender;
        globalState = GlobalStateContract(_globalStateAddress);
        revenueSharePercentage = _revenueSharePercentage;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function setTokenContract(
        address _tokenContractERC20Address
    ) external onlyOwner {
        require(
            address(tokenContractERC20) == address(0),
            "TokenContractERC20 address already set!"
        );
        tokenContractERC20 = TokenContractERC20(_tokenContractERC20Address);
    }

    function setLiquidityContract(
        address _liquidityContractAddress
    ) external onlyOwner {
        require(
            address(liquidityContract) == address(0),
            "LiquidityContract address already set!"
        );
        liquidityContract = LiquidityContract(_liquidityContractAddress);
    }

    function setRevenueDistributionContract(
        address _revenueDistributionContractAddress
    ) external onlyOwner {
        require(
            address(revenueDistributionContract) == address(0),
            "RevenueDistributionContract address already set!"
        );
        revenueDistributionContract = RevenueDistributionContract(
            _revenueDistributionContractAddress
        );
    }

    function buyTokens(uint256 amount) public payable {
        
        // Ensure the correct amount of ether is sent
        uint256 requiredEther = amount * tokenContractERC20.tokenPrice();
        require(msg.value == requiredEther, "Incorrect Ether sent");

        // Transfer the tokens to the investor
        tokenContractERC20.transferFrom(
            address(tokenContractERC20),
            msg.sender,
            amount
        );

        // Calculate Penomo's fee from the GlobalStateContract and the amount to send to the LiquidityContract
        uint256 feeAmount = (msg.value * globalState.penomoFee()) / 10000;
        uint256 liquidityAmount = msg.value - feeAmount;

        // Send the funds to the LiquidityContract via the receiveFunds function
        LiquidityContract(liquidityContract).receiveFunds{
            value: liquidityAmount
        }();

        emit TokensPurchased(msg.sender, amount);
    }

    function receiveFundsFromRevenueStream() external payable {
        // Calculate the amount after deducting Penomo's fee
        uint256 amountAfterFee = (msg.value *
            (10000 - globalState.penomoFee())) / 10000;

        // Calculate the amount to send to RevenueDistributionContract based on revenueSharePercentage
        uint256 amountForRDC = (amountAfterFee * revenueSharePercentage) /
            10000;

        // Calculate the amount to send to the LiquidityContract
        uint256 amountForLC = amountAfterFee - amountForRDC;

        // Send the funds
        RevenueDistributionContract(revenueDistributionContract)
            .receiveFunds{value: amountForRDC}();
        LiquidityContract(liquidityContract).receiveFunds{
            value: amountForLC
        }();

        emit ReceivedFundsFromRevenueStream(msg.sender, msg.value);
    }

    // Allows the owner to withdraw the accumulated Ether (Penomo's fees)
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Function to check the balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
