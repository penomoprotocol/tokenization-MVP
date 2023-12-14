// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityContract {
    address public serviceContract; // Address of the ServiceContract
    address public BBWallet; // Address of the Battery Business Wallet
    address public PenomoWallet; // Address of the penomo master wallet
    address public usdcTokenAddress; // Address of the USDC token contract

    // Events
    event ReceivedFunds(address indexed from, uint256 amount, string currency);
    event WithdrawnFunds(address indexed to, uint256 amount, string currency);

    constructor(
        address _serviceContract,
        address _BBWallet,
        address _PenomoWallet
    ) {
        serviceContract = _serviceContract;
        BBWallet = _BBWallet;
        PenomoWallet = _PenomoWallet;
        usdcTokenAddress = 0xB82dd712bD19e29347Ee01f6678296b5f3c8Cf03;
    }

    modifier onlyServiceContract() {
        require(msg.sender == serviceContract, "Only the ServiceContract can send funds");
        _;
    }

    modifier onlyOwners() {
        require(msg.sender == BBWallet || msg.sender == PenomoWallet, "Only the BBWallet or PenomoWallet can withdraw funds");
        _;
    }

    function receiveFunds() external payable onlyServiceContract {
        emit ReceivedFunds(msg.sender, msg.value, "ETH");
    }

    function receiveUsdcFunds(uint256 amount) external onlyServiceContract {
        require(IERC20(usdcTokenAddress).transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        emit ReceivedFunds(msg.sender, amount, "USDC");
    }

    function withdrawFunds(uint256 amount, bool withdrawInUsdc) external onlyOwners {
        if (withdrawInUsdc) {
            require(IERC20(usdcTokenAddress).balanceOf(address(this)) >= amount, "Insufficient USDC funds in the contract");
            require(IERC20(usdcTokenAddress).transfer(msg.sender, amount), "USDC transfer failed");
            emit WithdrawnFunds(msg.sender, amount, "USDC");
        } else {
            require(address(this).balance >= amount, "Insufficient ETH funds in the contract");
            payable(msg.sender).transfer(amount);
            emit WithdrawnFunds(msg.sender, amount, "ETH");
        }
    }

    function getBalance() external view returns (uint256 ethBalance, uint256 usdcBalance) {
        ethBalance = address(this).balance;
        usdcBalance = IERC20(usdcTokenAddress).balanceOf(address(this));
    }

    function setUsdcTokenAddress(address _usdcTokenAddress) external onlyOwners {
        usdcTokenAddress = _usdcTokenAddress;
    }
}
