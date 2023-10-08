pragma solidity ^0.8.0;

import "./TokenContract.sol"; // Import the token contract

contract ServiceContract {
    address public owner; // Penomo platform's address
    address[] public registeredInvestors; // Whitelist of registered investors
    TokenContract public tokenContract; // Reference to the token contract

    // Event to log the purchase of tokens
    event TokensPurchased(address indexed investor, uint256 amount);

    constructor(address _tokenContractAddress) {
        owner = msg.sender;
        tokenContract = TokenContract(_tokenContractAddress);
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

        emit TokensPurchased(msg.sender, amount);
    }

    function isRegisteredInvestor(address investor) public view returns(bool) {
        for(uint i = 0; i < registeredInvestors.length; i++) {
            if(registeredInvestors[i] == investor) {
                return true;
            }
        }
        return false;
    }

    // Allows the owner to withdraw the accumulated Ether
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
