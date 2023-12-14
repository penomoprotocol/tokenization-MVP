// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

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

    event TokensPurchased(
        address indexed investor,
        uint256 amount,
        string currency
    );
    event ReceivedRevenueUsdc(address indexed from, uint256 amount);
    event ReceivedRevenueEth(address indexed from, uint256 amount);
    event Debug(string message, uint256 value);
    event ApprovalSet(address indexed liquidityContract, uint256 amount);

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
        emit Debug("Currency fetched", 0); // Debugging event

        if (
            keccak256(abi.encodePacked(currency)) ==
            keccak256(abi.encodePacked("ETH"))
        ) {
            requiredAmount =
                (amount * tokenContractERC20.tokenPrice()) /
                10**18;
            //require(msg.value >= requiredAmount, "Incorrect ETH amount");
            emit Debug("Required Amount: ", requiredAmount); // Debugging event
            emit Debug("Received Amount: ", msg.value);

            // Calculate penomo's fee from the GlobalStateContract and the amount to send to the LiquidityContract
            uint256 feeAmount = (msg.value * globalState.penomoFee()) / 10000;
            uint256 liquidityAmount = msg.value - feeAmount;

            // Send the funds to the LiquidityContract via the receiveFunds function
            LiquidityContract(liquidityContract).receiveFunds{
                value: liquidityAmount
            }();
        } else if (
            keccak256(abi.encodePacked(currency)) ==
            keccak256(abi.encodePacked("USDC"))
        ) {
            IERC20 usdc = IERC20(tokenContractERC20.usdcTokenAddress());
            requiredAmount =
                (amount * tokenContractERC20.tokenPrice()) /
                10**18;
            require(
                usdc.transferFrom(msg.sender, address(this), requiredAmount),
                "USDC transfer failed"
            );
            emit Debug("USDC transfer initiated", requiredAmount); // Debugging event

            // Calculate penomo's fee from the GlobalStateContract and the amount to send to the LiquidityContract
            uint256 feeAmount = (requiredAmount * globalState.penomoFee()) /
                10000;

            uint256 liquidityAmount = requiredAmount - feeAmount;

            // Set allowance for LiquidityContract
            bool success = usdc.approve(
                address(liquidityContract),
                liquidityAmount
            );
            emit ApprovalSet(address(liquidityContract), liquidityAmount);
            require(success, "Approve failed");

            // Send the funds to the LiquidityContract via the receiveFunds function
            LiquidityContract(liquidityContract).receiveUsdcFunds(
                liquidityAmount
            );
        } else {
            revert("Currency not accepted");
        }

        // Transfer the tokens to the investor
        tokenContractERC20.transferFrom(
            address(tokenContractERC20),
            msg.sender,
            amount
        );

        emit TokensPurchased(msg.sender, amount, currency);
    }

    function receiveRevenueEth() external payable {
        uint256 amountAfterFee = (msg.value *
            (10000 - globalState.penomoFee())) / 10000;
        uint256 amountForRDC = (amountAfterFee *
            tokenContractERC20.revenueShare()) / 10000;
        uint256 amountForLC = amountAfterFee - amountForRDC;

        revenueDistributionContract.receiveFunds{value: amountForRDC}();
        liquidityContract.receiveFunds{value: amountForLC}();

        emit ReceivedRevenueEth(msg.sender, msg.value);
    }

    function receiveRevenueUsdc(uint256 usdcValue) external {
        IERC20 usdc = IERC20(tokenContractERC20.usdcTokenAddress());

        require(
            usdc.transferFrom(msg.sender, address(this), usdcValue),
            "USDC transfer failed"
        );
        
        emit Debug("USDC transfer initiated", usdcValue); // Debugging event

        uint256 amountAfterFee = (usdcValue *
            (10000 - globalState.penomoFee())) / 10000;
        uint256 amountForRDC = (amountAfterFee *
            tokenContractERC20.revenueShare()) / 10000;
        uint256 amountForLC = amountAfterFee - amountForRDC;

        // Set allowance for RDC
        usdc.approve(address(revenueDistributionContract), amountForRDC);

        // Set allowance for LiquidityContract
        usdc.approve(address(liquidityContract), amountForLC);

        revenueDistributionContract.receiveUsdcFunds(amountForRDC);
        liquidityContract.receiveUsdcFunds(amountForLC);

        emit ReceivedRevenueUsdc(msg.sender, usdcValue);
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getContractAddresses()
        external
        view
        returns (
            address,
            address,
            address,
            address
        )
    {
        return (
            address(tokenContractERC20),
            address(liquidityContract),
            address(revenueDistributionContract),
            address(globalState)
        );
    }
}
