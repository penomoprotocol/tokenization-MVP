// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

    // For debugging
    event EtherReceived(uint256 value);
    event EtherRequired(uint256 requiredEther);

    constructor(address _globalStateAddress) {
        owner = msg.sender;
        globalState = GlobalStateContract(_globalStateAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function setContractAddresses(
        address _tokenContractERC20Address,
        address _liquidityContractAddress,
        address _revenueDistributionContractAddress
    ) external onlyOwner {
        tokenContractERC20 = TokenContractERC20(_tokenContractERC20Address);
        revenueSharePercentage = tokenContractERC20.revenueShare();
        liquidityContract = LiquidityContract(_liquidityContractAddress);
        revenueDistributionContract = RevenueDistributionContract(
            _revenueDistributionContractAddress
        );
    }

    function buyTokens(uint256 amount) public payable {
        // Ensure the correct amount of wei is sent to receive amount of tokens (also in wei).
        uint256 requiredWei = (amount * tokenContractERC20.tokenPrice()) /
            10 ** 18;
        // require(msg.value >= requiredWei, "Incorrect Wei sent");

        // For debugging
        emit EtherReceived(msg.value);
        emit EtherRequired(requiredWei);

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
        RevenueDistributionContract(revenueDistributionContract).receiveFunds{
            value: amountForRDC
        }();
        LiquidityContract(liquidityContract).receiveFunds{value: amountForLC}();

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

    function getContractAddresses()
        external
        view
        returns (address, address, address, address)
    {
        return (
            address(tokenContractERC20),
            address(liquidityContract),
            address(revenueDistributionContract),
            address(globalState)
        );
    }
}
