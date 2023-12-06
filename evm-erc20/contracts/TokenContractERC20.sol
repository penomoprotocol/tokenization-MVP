// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GlobalStateContract.sol";

contract TokenContractERC20 is ERC20 {
    uint256 public revenueShare; // in basis points (e.g., 500 for 5%)
    uint256 public maxTokenSupply;
    uint256 public tokenPrice; // Price in smallest unit of currency
    string public acceptedCurrency; // "ETH" or "USDC"
    address public usdcTokenAddress; // USDC contract address
    GlobalStateContract public globalState;
    address public serviceContract;
    address public penomoWallet;

    struct Battery {
        string DID; // Battery DID
        string CID; // Battery Data CID (IPFS)
        uint256 revenueGoal; // Revenue goal in currency's smallest unit for contract term
    }
    Battery[] public batteries;
    address[] public tokenHolders;

    // Events
    event TokenTransferInitiated(address indexed from, address indexed to, uint256 amount);
    event Debug(string message, uint256 value);


    struct ConstructorArgs {
        address penomoWallet;
        address globalStateAddress;
        address serviceContractAddress;
        string name;
        string symbol;
        uint256 revenueShare;
        uint256 maxTokenSupply;
        uint256 tokenPrice;
        string currency;
    }

    constructor(
        ConstructorArgs memory args,
        string[] memory DIDs,
        string[] memory CIDs,
        uint256[] memory revenueGoals
    ) ERC20(args.name, args.symbol) {
        penomoWallet = args.penomoWallet;
        globalState = GlobalStateContract(args.globalStateAddress);
        serviceContract = args.serviceContractAddress;
        revenueShare = args.revenueShare;
        maxTokenSupply = args.maxTokenSupply * 10 ** 18;
        tokenPrice = args.tokenPrice;
        acceptedCurrency = args.currency;
        usdcTokenAddress = 0xD0A0D62413cB0577B2B9a52CA8b05C03bb56ccE8;

        for (uint i = 0; i < DIDs.length; i++) {
            Battery memory newBattery = Battery({
                DID: DIDs[i],
                CID: CIDs[i],
                revenueGoal: revenueGoals[i]
            });
            batteries.push(newBattery);
        }

        _mint(address(this), maxTokenSupply);
        _approve(address(this), args.serviceContractAddress, maxTokenSupply);
        emit Debug(allowance(address(this), args.serviceContractAddress));
    }

    modifier onlyPenomoWallet() {
        require(msg.sender == penomoWallet, "Only penomoWallet can execute this");
        _;
    }

    function forceTransfer(address from, address to, uint256 amount) public onlyPenomoWallet {
        _transfer(from, to, amount);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        emit TokenTransferInitiated(msg.sender, recipient, amount); // Debugging event
        _beforeTokenTransfer(recipient);
        super.transfer(recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        emit TokenTransferInitiated(sender, recipient, amount); // Debugging event
        _beforeTokenTransfer(recipient);
        super.transferFrom(sender, recipient, amount);
        return true;
    }

    function _beforeTokenTransfer(address to) internal {
        require(globalState.verifiedInvestors(to), "Recipient is not whitelisted as registered investor.");
        if (!isTokenHolder(to) && to != address(0)) {
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

    function getTokenHolders() external view returns (address[] memory) {
        return tokenHolders;
    }

    // Additional functions to handle the currency and USDC address
    function setCurrency(string memory _currency) external onlyPenomoWallet {
        acceptedCurrency = _currency;
    }

    function setUsdcTokenAddress(address _usdcTokenAddress) external onlyPenomoWallet {
        usdcTokenAddress = _usdcTokenAddress;
    }
}
