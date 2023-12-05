// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenContractERC20.sol";
import "./LiquidityContract.sol";
import "./RevenueDistributionContract.sol";
import "./GlobalStateContract.sol";

contract ServiceContract {
    address public owner;
    TokenContractERC20 public tokenContractERC20;
    LiquidityContract public liquidityContract;
    RevenueDistributionContract public revenueDistributionContract;
    GlobalStateContract public globalState;

    event TokensPurchased(address indexed investor, uint256 amount);
    event ReceivedFundsFromRevenueStream(address indexed from, uint256 amount);

    constructor(address _globalStateAddress) {
        owner = msg.sender;
        globalState = GlobalStateContract(_globalStateAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    function setContractAddresses(
        address _tokenContractERC20Address,
        address _liquidityContractAddress,
        address _revenueDistributionContractAddress
    ) external onlyOwner {
        tokenContractERC20 = TokenContractERC20(_tokenContractERC20Address);
        liquidityContract = LiquidityContract(_liquidityContractAddress);
        revenueDistributionContract = RevenueDistributionContract(
            _revenueDistributionContractAddress
        );
    }

    function buyTokens(uint256 amount) public payable {
        uint256 requiredAmount;
        string memory currency = tokenContractERC20.acceptedCurrency();
        if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked("ETH"))) {
            requiredAmount = amount * tokenContractERC20.tokenPrice();
            require(msg.value >= requiredAmount, "Incorrect ETH amount");
        } else if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked("USDC"))) {
            IERC20 usdc = IERC20(tokenContractERC20.usdcTokenAddress());
            requiredAmount = amount * tokenContractERC20.tokenPrice()/10**18;
            require(usdc.transferFrom(msg.sender, address(this), requiredAmount), "USDC transfer failed");
        } else {
            revert("Currency not accepted");
        }

        tokenContractERC20.transferFrom(address(this), msg.sender, amount);
        emit TokensPurchased(msg.sender, amount);
    }

    function receiveFundsFromRevenueStream() external payable {
        uint256 amountAfterFee = (msg.value * (10000 - globalState.penomoFee())) / 10000;
        uint256 amountForRDC = (amountAfterFee * tokenContractERC20.revenueShare()) / 10000;
        uint256 amountForLC = amountAfterFee - amountForRDC;

        revenueDistributionContract.receiveFunds{ value: amountForRDC }();
        liquidityContract.receiveFunds{ value: amountForLC }();

        emit ReceivedFundsFromRevenueStream(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getContractAddresses() external view returns (address, address, address, address) {
        return (
            address(tokenContractERC20),
            address(liquidityContract),
            address(revenueDistributionContract),
            address(globalState)
        );
    }
}
