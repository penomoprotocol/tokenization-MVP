// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GlobalStateContract {
    address public owner;
    address[] public verifiedInvestors;
    address[] public verifiedCompanies;
    
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
        require(!isVerifiedInvestor(investor), "Investor is already verified");
        verifiedInvestors.push(investor);
        emit InvestorVerified(investor);
    }

        function verifyCompany(address company) external onlyOwner {
        require(!isVerifiedCompany(company), "Company is already verified");
        verifiedCompanies.push(company);
        emit CompanyVerified(company);
    }

    function setPenomoFee(uint256 _penomoFee) external onlyOwner {
        penomoFee = _penomoFee;
        emit PenomoFeeUpdated(_penomoFee);
    }

    function isVerifiedInvestor(address investor) public view returns(bool) {
        for(uint i = 0; i < verifiedInvestors.length; i++) {
            if(verifiedInvestors[i] == investor) {
                return true;
            }
        }
        return false;
    }

    function isVerifiedCompany(address company) public view returns(bool) {
        for(uint i = 0; i < verifiedCompanies.length; i++) {
            if(verifiedCompanies[i] == company) {
                return true;
            }
        }
        return false;
    }


}
