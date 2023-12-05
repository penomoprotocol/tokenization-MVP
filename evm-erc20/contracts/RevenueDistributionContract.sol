// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenContractERC20.sol";
import "./LiquidityContract.sol";

contract RevenueDistributionContract {
    address public serviceContract; // Address of the service contract
    TokenContractERC20 public tokenContractERC20; // Instance of the token contract
    LiquidityContract public liquidityContract; // Address of the liquidity contract
    address public usdcTokenAddress; // Address of the USDC token contract

    // Events
    event ReceivedFunds(address indexed from, uint256 amount, string currency);
    event DistributedRevenue(address indexed to, uint256 amount, string currency);

    constructor(
        address _serviceContract,
        address _tokenContractERC20,
        address _liquidityContract,
        address _usdcTokenAddress
    ) {
        serviceContract = _serviceContract;
        tokenContractERC20 = TokenContractERC20(_tokenContractERC20);
        liquidityContract = LiquidityContract(_liquidityContract);
        usdcTokenAddress = _usdcTokenAddress;
    }

    modifier onlyServiceContract() {
        require(msg.sender == serviceContract, "Only the ServiceContract can send funds");
        _;
    }

    function receiveFunds() external payable onlyServiceContract {
        emit ReceivedFunds(msg.sender, msg.value, "ETH");
        distributeRevenue("ETH");
    }

    function receiveUsdcFunds(uint256 amount) external onlyServiceContract {
        require(IERC20(usdcTokenAddress).transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        emit ReceivedFunds(msg.sender, amount, "USDC");
        distributeRevenue("USDC");
    }

    function distributeRevenue(string memory currency) internal {
        uint256 totalSupply = tokenContractERC20.totalSupply();
        require(totalSupply > 0, "No tokens in circulation");

        if (keccak256(bytes(currency)) == keccak256(bytes("ETH"))) {
            distributeEthRevenue();
        } else if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            distributeUsdcRevenue();
        }
    }

    function distributeEthRevenue() internal {
        uint256 receivedFunds = address(this).balance;
        distributeFunds(receivedFunds, "ETH");
    }

    function distributeUsdcRevenue() internal {
        uint256 receivedFunds = IERC20(usdcTokenAddress).balanceOf(address(this));
        distributeFunds(receivedFunds, "USDC");
    }

    function distributeFunds(uint256 receivedFunds, string memory currency) internal {
        address[] memory tokenHolders = tokenContractERC20.getTokenHolders();
        for (uint256 i = 0; i < tokenHolders.length; i++) {
            address holder = tokenHolders[i];
            uint256 holderBalance = tokenContractERC20.balanceOf(holder);
            uint256 holderShare = (receivedFunds * holderBalance) / tokenContractERC20.totalSupply();

            if (keccak256(bytes(currency)) == keccak256(bytes("ETH"))) {
                payable(holder).transfer(holderShare);
            } else if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
                require(IERC20(usdcTokenAddress).transfer(holder, holderShare), "USDC transfer failed");
            }

            emit DistributedRevenue(holder, holderShare, currency);
        }

        // Send remaining funds to LiquidityContract
        uint256 remainingFunds = (keccak256(bytes(currency)) == keccak256(bytes("ETH")))
            ? address(this).balance
            : IERC20(usdcTokenAddress).balanceOf(address(this));
        
        if (remainingFunds > 0) {
            if (keccak256(bytes(currency)) == keccak256(bytes("ETH"))) {
                LiquidityContract(liquidityContract).receiveFunds{value: remainingFunds}();
            } else if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
                require(IERC20(usdcTokenAddress).transfer(address(liquidityContract), remainingFunds), "USDC transfer to LiquidityContract failed");
            }
        }
    }

    function getBalance() external view returns (uint256 ethBalance, uint256 usdcBalance) {
        ethBalance = address(this).balance;
        usdcBalance = IERC20(usdcTokenAddress).balanceOf(address(this));
    }

    function setUsdcTokenAddress(address _usdcTokenAddress) external onlyServiceContract {
        usdcTokenAddress = _usdcTokenAddress;
    }
}
