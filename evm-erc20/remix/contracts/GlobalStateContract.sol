// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GlobalStateContract {
    address public owner;
    mapping(address => bool) public verifiedInvestors;
    mapping(address => bool) public verifiedCompanies;
    
    uint256 public penomoFee;

    event InvestorVerified(address indexed investor);
    event CompanyVerified(address indexed company);
    event PenomoFeeUpdated(uint256 newFee);

    constructor(uint256 _penomoFee) {
        owner = msg.sender;
        penomoFee = _penomoFee;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function verifyInvestor(address investor) external onlyOwner {
        require(!verifiedInvestors[investor], "Investor is already verified");
        verifiedInvestors[investor] = true;
        emit InvestorVerified(investor);
    }

    function verifyCompany(address company) external onlyOwner {
        require(!verifiedCompanies[company], "Company is already verified");
        verifiedCompanies[company] = true;
        emit CompanyVerified(company);
    }

    function setPenomoFee(uint256 _penomoFee) external onlyOwner {
        penomoFee = _penomoFee;
        emit PenomoFeeUpdated(_penomoFee);
    }

}
