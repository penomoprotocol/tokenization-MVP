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
    event TokensListedForSale(address indexed seller, uint256 amount);
    event TokensSold(
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

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
        require(
            globalState.verifiedInvestors(msg.sender),
            "Buyer is not whitelisted as registered investor."
        );
        // Ensure the correct amount of wei is sent
        uint256 requiredWei = (amount / 10 ** 18) *
            tokenContractERC20.tokenPrice();
        require(msg.value >= requiredWei, "Insufficient Wei sent.");

        // Loop through token listings to fulfill order
        uint256 remainingAmount = amount;
        while (
            remainingAmount > 0 && tokenContractERC20.getListingsCount() > 0
        ) {
            TokenContractERC20.TokenListing memory listing = tokenContractERC20
                .getListing(0);

            uint256 availableAmount = listing.amount > remainingAmount
                ? remainingAmount
                : listing.amount;

            // Transfer tokens from seller to buyer
            tokenContractERC20.transferFrom(
                listing.seller,
                msg.sender,
                availableAmount
            );

            // TODO: Substract the penomo fee here for every transaction
            // Transfer funds from buyer to seller
            uint256 transactionAmount = availableAmount *
                tokenContractERC20.tokenPrice() / 10**18 ;
            payable(listing.seller).transfer(transactionAmount);

            // Emit event
            emit TokensSold(msg.sender, listing.seller, availableAmount);

            // Update listing or remove if fulfilled
            if (listing.amount == availableAmount) {
                tokenContractERC20.removeTokenListing(0);
            } else {
                tokenContractERC20.updateTokenListing(
                    0,
                    listing.amount - availableAmount
                );
            }

            remainingAmount -= availableAmount;
        }

        // If there are still tokens to buy, buy from the token contract
        if (remainingAmount > 0) {
            // Transfer the tokens to the investor
            tokenContractERC20.transferFrom(
                address(tokenContractERC20),
                msg.sender,
                remainingAmount
            );

            // Calculate Penomo's fee and the amount to send to the LiquidityContract
            uint256 feeAmount = (msg.value * globalState.penomoFee()) / 10000;
            uint256 liquidityAmount = msg.value - feeAmount;

            // Send the funds to the LiquidityContract
            LiquidityContract(liquidityContract).receiveFunds{
                value: liquidityAmount
            }();
        }

        emit TokensPurchased(msg.sender, amount - remainingAmount);
    }

    function sellTokens(uint256 amount) public {
        require(
            globalState.verifiedInvestors(msg.sender),
            "Seller is not whitelisted as registered investor."
        );
        require(
            tokenContractERC20.balanceOf(msg.sender) >= amount,
            "Insufficient token balance."
        );

        // List the tokens for sale
        tokenContractERC20.addTokenListing(msg.sender, amount);

        // Emit event
        emit TokensListedForSale(msg.sender, amount);
    }

    function receiveFundsFromRevenueStream() external payable {
        // Calculate the amount after deducting Penomo's fee
        uint256 amountAfterFee = (msg.value *
            (10000 - globalState.penomoFee())) / 10000;

        // Calculate the amount to send to RevenueDistributionContract
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
