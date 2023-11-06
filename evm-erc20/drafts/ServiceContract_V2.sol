// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import other contracts and interfaces as necessary
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

    struct SellOrder {
        address seller;
        uint256 tokenAmount;
        uint256 etherAmount;
        bool isActive;
    }

    uint256 public nextOrderId = 0;
    mapping(uint256 => SellOrder) public sellOrders;

    event TokensPurchased(address indexed buyer, uint256 amount);
    event SellOrderCreated(uint256 indexed orderId, address indexed seller, uint256 tokenAmount, uint256 etherAmount);
    event SellOrderFulfilled(uint256 indexed orderId, address indexed buyer, address indexed seller);
    event SellOrderCancelled(uint256 indexed orderId, address indexed seller);

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
        liquidityContract = LiquidityContract(_liquidityContractAddress);
        revenueDistributionContract = RevenueDistributionContract(_revenueDistributionContractAddress);
        revenueSharePercentage = tokenContractERC20.revenueShare();
    }

    function buyTokens(uint256 amount) public payable {
        uint256 remainingAmount = amount;
        uint256 remainingEther = msg.value;
        uint256 orderId = 0;

        while (remainingAmount > 0 && orderId < nextOrderId) {
            SellOrder storage order = sellOrders[orderId];
            if (order.isActive && order.tokenAmount <= remainingAmount && order.etherAmount <= remainingEther) {
                // Fulfill the sell order
                remainingAmount -= order.tokenAmount;
                remainingEther -= order.etherAmount;
                order.isActive = false;
                tokenContractERC20.transferFrom(order.seller, msg.sender, order.tokenAmount);
                payable(order.seller).transfer(order.etherAmount);
                emit SellOrderFulfilled(orderId, msg.sender, order.seller);
            }
            orderId++;
        }

        if (remainingAmount > 0) {
            uint256 requiredWei = tokenContractERC20.calculateTokenPurchaseCost(remainingAmount);
            require(remainingEther >= requiredWei, "Insufficient Ether sent for token purchase.");
            remainingEther -= requiredWei;
            // Direct token purchase from the contract
            tokenContractERC20.transfer(msg.sender, remainingAmount);
        }

        require(remainingEther == 0, "Ether left after token purchase.");
        emit TokensPurchased(msg.sender, amount - remainingAmount);
    }

    function createSellOrder(uint256 tokenAmount, uint256 etherAmount) public {
        require(tokenContractERC20.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance for sell order.");
        require(tokenContractERC20.allowance(msg.sender, address(this)) >= tokenAmount, "Contract is not authorized to sell tokens on behalf of the seller.");

        uint256 orderId = nextOrderId++;
        sellOrders[orderId] = SellOrder({
            seller: msg.sender,
            tokenAmount: tokenAmount,
            etherAmount: etherAmount,
            isActive: true
        });

        emit SellOrderCreated(orderId, msg.sender, tokenAmount, etherAmount);
    }

    function cancelSellOrder(uint256 orderId) public {
        SellOrder storage order = sellOrders[orderId];
        require(order.seller == msg.sender, "You can only cancel your own sell orders.");
        require(order.isActive, "Sell order is not active.");

        order.isActive = false;
        emit SellOrderCancelled(orderId, msg.sender);
    }

    // ... other functions ...

    // Allow the owner to withdraw the accumulated Ether (Penomo's fees)
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
    }

    // Function to check the balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ... more functions or logic as needed ...

    // Helper functions, error handling, etc.
}
