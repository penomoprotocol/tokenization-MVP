// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./GlobalStateContract.sol";

contract TokenContractERC20 is ERC20 {
    uint256 public revenueShare; // in basis points (e.g., 500 for 5%)
    uint256 public contractTerm; // in months
    uint256 public maxTokenSupply;
    uint256 public tokenPrice; // in wei
    GlobalStateContract public globalState;
    address public serviceContract;
    address public penomoWallet;

    struct Battery {
        string DID;
        uint256 revenueGoal;
    }
    Battery[] public batteries;
    address[] public tokenHolders;

    struct TokenListing {
        address seller;
        uint256 amount;
    }
    TokenListing[] public listings;

    // Events for debugging
    event Debug(uint256 allowance);

    struct ConstructorArgs {
        address penomoWallet;
        address globalStateAddress;
        address serviceContractAddress;
        string name;
        string symbol;
        uint256 revenueShare;
        uint256 contractTerm;
        uint256 maxTokenSupply;
        uint256 tokenPrice;
    }

    constructor(
        ConstructorArgs memory args,
        string[] memory DIDs,
        uint256[] memory revenueGoals
    ) ERC20(args.name, args.symbol) {
        penomoWallet = args.penomoWallet;
        globalState = GlobalStateContract(args.globalStateAddress);
        serviceContract = args.serviceContractAddress;
        revenueShare = args.revenueShare;
        contractTerm = args.contractTerm;
        maxTokenSupply = args.maxTokenSupply * 10 ** 18;
        tokenPrice = args.tokenPrice;

        for (uint i = 0; i < DIDs.length; i++) {
            Battery memory newBattery = Battery({
                DID: DIDs[i],
                revenueGoal: revenueGoals[i]
            });
            batteries.push(newBattery);
        }

        // Mint the maximum supply of tokens to the contract's address upon construction
        _mint(address(this), maxTokenSupply);

        // Set the allowance for the ServiceContract
        _approve(address(this), args.serviceContractAddress, maxTokenSupply);

        // Emit allowance for debugging
        emit Debug(allowance(address(this), args.serviceContractAddress));
    }

    modifier onlyPenomoWallet() {
        require(
            msg.sender == penomoWallet,
            "Only penomoWallet can execute this"
        );
        _;
    }

    function forceTransfer(
        address from,
        address to,
        uint256 amount
    ) public onlyPenomoWallet {
        _transfer(from, to, amount);
    }

    // Function to update token price
    function updateTokenPrice(uint256 newPrice) public onlyPenomoWallet {
        tokenPrice = newPrice;
    }

    // Function to list tokens for sale
    function addTokenListing(address seller, uint256 amount) public {
        require(msg.sender == serviceContract, "Only ServiceContract can add listings");
        listings.push(TokenListing(seller, amount));
    }

    // Function to remove token listing
    function removeTokenListing(uint256 index) public {
        require(msg.sender == serviceContract, "Only ServiceContract can remove listings");
        require(index < listings.length, "Invalid index");
        listings[index] = listings[listings.length - 1];
        listings.pop();
    }

    // Function to update token listing
    function updateTokenListing(uint256 index, uint256 newAmount) public {
        require(msg.sender == serviceContract, "Only ServiceContract can update listings");
        require(index < listings.length, "Invalid index");
        listings[index].amount = newAmount;
    }

    function getListing(uint index) public view returns (TokenListing memory) {
    require(index < listings.length, "Index out of bounds");
    return listings[index];
}

    function getListingsCount() public view returns (uint) {
    return listings.length;
}

    // Override the transfer function
    function transfer(
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        // Call the _beforeTokenTransfer hook
        _beforeTokenTransfer(recipient);

        // Call the original transfer function from the parent ERC20 contract
        super.transfer(recipient, amount);

        return true;
    }

    // Override the transferFrom function
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        // Call the _beforeTokenTransfer hook
        _beforeTokenTransfer(recipient);

        // Call the original transferFrom function from the parent ERC20 contract
        super.transferFrom(sender, recipient, amount);

        return true;
    }

    function _beforeTokenTransfer(
        //address from,
        address to
    ) internal //uint256 amount
    {
        require(
            globalState.verifiedInvestors(to),
            "Recipient is not whitelisted as registered investor."
        );

        // If the recipient is not already a token holder, add them to the list
        if (!isTokenHolder(to) && to != address(0)) {
            // address(0) check is to ensure the zero address is not added
            tokenHolders.push(to);
        }
    }

    function isTokenHolder(address _address) public view returns (bool) {
        for (uint256 i = 0; i < tokenHolders.length; i++) {
            if (tokenHolders[i] == _address) {
                return true;
            }
        }
        return false;
    }

    // Function to return the list of token holders
    function getTokenHolders() external view returns (address[] memory) {
        return tokenHolders;
    }

}
