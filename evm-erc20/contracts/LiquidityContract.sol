// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LiquidityContract {
    address public serviceContract; // Address of the ServiceContract
    address public BBWallet; // Address of the Battery Business Wallet
    address public PenomoWallet; // Address of the Penomo platform's wallet

    // Events
    event ReceivedFunds(address indexed from, uint256 amount);
    event WithdrawnFunds(address indexed to, uint256 amount);

    constructor(address _serviceContract, address _BBWallet, address _PenomoWallet) {
        serviceContract = _serviceContract;
        BBWallet = _BBWallet;
        PenomoWallet = _PenomoWallet;
    }

    // Modifier to ensure only the ServiceContract can send funds
    modifier onlyServiceContract() {
        require(msg.sender == serviceContract, "Only the ServiceContract can send funds");
        _;
    }

    // Modifier to ensure only the BBWallet or PenomoWallet can withdraw funds
    modifier onlyOwners() {
        require(msg.sender == BBWallet || msg.sender == PenomoWallet, "Only the BBWallet or PenomoWallet can withdraw funds");
        _;
    }

    // Function to receive funds from the ServiceContract
    function receiveFunds() external payable {
        emit ReceivedFunds(msg.sender, msg.value);
    }

    // Function to withdraw funds by the BBWallet or PenomoWallet
    function withdrawFunds(uint256 amount) external onlyOwners {
        require(address(this).balance >= amount, "Insufficient funds in the contract");
        payable(msg.sender).transfer(amount);
        emit WithdrawnFunds(msg.sender, amount);
    }

    // Function to check the balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
