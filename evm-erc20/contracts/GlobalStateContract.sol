// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GlobalStateContract {
    address public owner;
    address[] public registeredInvestors;
    uint256 public penomoFee;

    event InvestorRegistered(address indexed investor);
    event PenomoFeeUpdated(uint256 newFee);

    constructor(uint256 _penomoFee) {
        owner = msg.sender;
        penomoFee = _penomoFee;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function registerInvestor(address investor) external onlyOwner {
        require(!isRegisteredInvestor(investor), "Investor is already registered");
        registeredInvestors.push(investor);
        emit InvestorRegistered(investor);
    }

    function setPenomoFee(uint256 _penomoFee) external onlyOwner {
        penomoFee = _penomoFee;
        emit PenomoFeeUpdated(_penomoFee);
    }

    function isRegisteredInvestor(address investor) public view returns(bool) {
        for(uint i = 0; i < registeredInvestors.length; i++) {
            if(registeredInvestors[i] == investor) {
                return true;
            }
        }
        return false;
    }
}
