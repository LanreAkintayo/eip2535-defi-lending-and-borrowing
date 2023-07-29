//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


struct Token {
    address tokenAddress;
    uint8 liquidationThreshold;
    uint8 loanToValue;
    uint8 borrowStableRate;
    uint8 lendStableRate;
    uint8 liquidationPenalty;
}

struct SuppliedToken {
    address tokenAddress;
    address supplierAddress;
    uint256 amountSupplied;
    uint256 currentInterest;
    bool isCollateral;
    uint256 startEarningDay;
}

struct BorrowedToken {
    address tokenAddress;
    address borrowerAddress;
    uint256 amountBorrowed;
    uint256 startAccumulatingDay;
    uint256 borrowedInterest;
    uint256 stableRate;
   
}


    
struct AppStorage {
   address larTokenAddress;
   address[] supportedTokens;
   mapping(address => Token) addressToToken;
   mapping(address => address) tokenToPriceFeed;

   mapping(address => SuppliedToken[]) tokensSupplied;
   mapping(address => BorrowedToken[]) tokensBorrowed;
   

   address[] allSuppliers;
   address[] allBorrowers;



}

library LibAppStorage {
    // diamondStorage() returns the position of the App storage struct in the diamond contract
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function _indexOf(address targetAddress, address[] memory addressArray) internal pure returns(int256){
        for (uint256 i = 0; i < addressArray.length; i++){
            if (targetAddress == addressArray[i]){
                return int256(i);
            }
        }
        return -1;
    }

    function _getUserTotalCollateralInUsd(address user) internal view returns(uint256){
        AppStorage storage s = diamondStorage();
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];
        uint totalCollateralInUsd = 0;

        for (uint i = 0; i < suppliedTokens.length; i++){
            SuppliedToken memory currentSuppliedToken = suppliedTokens[i];

            uint256 inUsd = _getUsdEquivalent(currentSuppliedToken.amountSupplied, currentSuppliedToken.tokenAddress);

            totalCollateralInUsd += inUsd;

        }
        return totalCollateralInUsd;
    }

    function _getUserTotalBorrowedInUsd(address user) internal view returns(uint256){
        AppStorage storage s = diamondStorage();
        BorrowedToken[] memory borrowedTokens = s.tokensBorrowed[user];
        uint totalBorrowedInUsd = 0;

        for (uint i = 0; i < borrowedTokens.length; i++){
            BorrowedToken memory currentBorrowedToken = borrowedTokens[i];

            uint256 inUsd = _getUsdEquivalent(currentBorrowedToken.amountBorrowed, currentBorrowedToken.tokenAddress);

            totalBorrowedInUsd += inUsd;

        }
        return totalBorrowedInUsd;

    }

    function _maxLTV(address user) internal view returns(uint256){
        AppStorage storage s = diamondStorage();
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];
        uint numerator = 0;
        uint256 userTotalCollateral = _getUserTotalCollateralInUsd(user);

        for (uint i = 0; i < suppliedTokens.length; i++){
            SuppliedToken memory currentSuppliedToken = suppliedTokens[i];
            Token memory tokenDetails = s.addressToToken[currentSuppliedToken.tokenAddress];

            uint256 collateralInUsd = _getUsdEquivalent(currentSuppliedToken.amountSupplied, currentSuppliedToken.tokenAddress);

            numerator += (collateralInUsd * tokenDetails.loanToValue);

        }
        return numerator / userTotalCollateral;
    }

    function _liquidationThreshold(address user) internal view returns(uint256){
         AppStorage storage s = diamondStorage();
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];
        uint numerator = 0;
        uint256 userTotalCollateral = _getUserTotalCollateralInUsd(user);

        for (uint i = 0; i < suppliedTokens.length; i++){
            SuppliedToken memory currentSuppliedToken = suppliedTokens[i];
            Token memory tokenDetails = s.addressToToken[currentSuppliedToken.tokenAddress];

            uint256 collateralInUsd = _getUsdEquivalent(currentSuppliedToken.amountSupplied, currentSuppliedToken.tokenAddress);

            numerator += (collateralInUsd * tokenDetails.liquidationThreshold);

        }
        return numerator / userTotalCollateral;
    }

    function _healthFactor(address user) internal view returns(uint256){
        uint256 userTotalCollateral = _getUserTotalCollateralInUsd(user);
        uint256 userLiquidationThreshold = _liquidationThreshold(user);
        uint256 userTotalBorrowed = _getUserTotalBorrowedInUsd(user);
        return (userTotalCollateral * userLiquidationThreshold) /  userTotalBorrowed;
    }


     function _getUsdEquivalent(uint256 amount, address tokenAddress)
        internal
        view
        returns (uint256)
    {
        (
            uint256 dollarPerToken,
            uint256 decimals
        ) = _oneTokenEqualsHowManyDollars(tokenAddress);

        uint256 totalAmountInDollars = (amount * dollarPerToken) /
            (10**decimals);
        return totalAmountInDollars;
    }

    function _oneTokenEqualsHowManyDollars(address tokenAddress)
        internal
        view
        returns (uint256, uint256)
    {
        AppStorage storage s = diamondStorage();
        address tokenPriceFeed = s.tokenToPriceFeed[tokenAddress];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenPriceFeed);

        (, int256 price, , , ) = priceFeed.latestRoundData();

        uint256 decimals = priceFeed.decimals();

        return (uint256(price), decimals);
    }



  
}