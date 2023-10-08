// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RevenueStreamContract {
    address public owner; // Battery Business's address
    address public serviceContract; // Address of the ServiceContract
    uint256 public pricePerKWh; // Price per kWh in wei
    uint256 public currentKWh; // Current kWh reading
    uint256 public startKWh; // kWh reading at the start of the rental

    bool public isRentalActive = false; // Flag to check if a rental is active

    mapping(address => bool) public authorizedBatteries; // Mapping of authorized battery wallets

    event RentalStarted(uint256 startKWh);
    event RentalStopped(uint256 totalAmount);

    constructor(address _serviceContract, uint256 _pricePerKWh) {
        owner = msg.sender;
        serviceContract = _serviceContract;
        pricePerKWh = _pricePerKWh;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    modifier onlyAuthorizedBattery() {
        require(authorizedBatteries[msg.sender], "Not an authorized battery");
        _;
    }

    modifier rentalActive() {
        require(isRentalActive, "Rental is not active");
        _;
    }

    modifier rentalNotActive() {
        require(!isRentalActive, "Rental is already active");
        _;
    }

    // Authorize a battery wallet to update kWh readings
    function authorizeBattery(address battery) external onlyOwner {
        authorizedBatteries[battery] = true;
    }

    // Revoke authorization of a battery wallet
    function revokeBatteryAuthorization(address battery) external onlyOwner {
        authorizedBatteries[battery] = false;
    }

    // Start the rental and set the initial kWh reading
    function startRental(uint256 _startKWh) external onlyOwner rentalNotActive {
        startKWh = _startKWh;
        isRentalActive = true;
        emit RentalStarted(startKWh);
    }

    // Update the current kWh reading
    function updateKWhReading(uint256 _currentKWh) external onlyAuthorizedBattery rentalActive {
        require(_currentKWh > startKWh, "Current kWh should be greater than start kWh");
        currentKWh = _currentKWh;
    }

    // Stop the rental, calculate the total amount, and send it to the ServiceContract
    function stopRental() external onlyOwner rentalActive {
        uint256 kWhUsed = currentKWh - startKWh;
        uint256 totalAmount = kWhUsed * pricePerKWh;

        // Reset rental state
        isRentalActive = false;
        startKWh = 0;
        currentKWh = 0;

        // Transfer the total amount to the ServiceContract
        payable(serviceContract).transfer(totalAmount);

        emit RentalStopped(totalAmount);
    }

    // Allows the owner to withdraw any excess funds (in case of overpayment or other scenarios)
    function withdrawExcessFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Fallback function to accept Ether
    receive() external payable {}
}
