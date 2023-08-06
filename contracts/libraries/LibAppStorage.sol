//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
import "../interfaces/IERC20.sol";

struct Token {
    address tokenAddress;
    uint32 liquidationThreshold;
    uint32 loanToValue;
    uint32 borrowStableRate;
    uint32 supplyStableRate;
    uint32 liquidationPenalty;
}

struct SuppliedToken {
    address tokenAddress;
    address supplierAddress;
    uint256 amountSupplied;
    uint256 supplyInterest;
    uint256 supplyStableRate;
    uint256 startAccumulatingDay;
    bool isCollateral;
}

struct BorrowedToken {
    address tokenAddress;
    address borrowerAddress;
    uint256 amountBorrowed;
    uint256 startAccumulatingDay;
    uint256 borrowedInterest;
    uint256 stableRate;
}

struct TokenPriceFeed {
    address tokenAddress;
    address priceFeed;
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

    mapping(address => uint256) totalSupplied;
    mapping(address => uint256) totalBorrowed;
}

library LibAppStorage {
    // diamondStorage() returns the position of the App storage struct in the diamond contract
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function _indexOf(
        address targetAddress,
        address[] memory addressArray
    ) internal pure returns (int256) {
        for (uint256 i = 0; i < addressArray.length; i++) {
            if (targetAddress == addressArray[i]) {
                return int256(i);
            }
        }
        return -1;
    }

    function _getUserTotalCollateralInUsd(
        AppStorage storage s,
        address user
    ) internal view returns (uint256) {
        // AppStorage storage s = diamondStorage();
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];
        uint totalCollateralInUsd = 0;

        for (uint i = 0; i < suppliedTokens.length; i++) {
            SuppliedToken memory currentSuppliedToken = suppliedTokens[i];
            uint8 decimals = IERC20(currentSuppliedToken.tokenAddress)
                .decimals();

            uint256 inUsd = _getUsdEquivalent(
                s,
                currentSuppliedToken.amountSupplied,
                currentSuppliedToken.tokenAddress
            );

            uint256 scaledUsdAmount = (inUsd * 10 ** 18) / 10 ** decimals;

            totalCollateralInUsd += scaledUsdAmount;
        }
        return totalCollateralInUsd;
    }

    function _getUserTotalBorrowedInUsd(
        AppStorage storage s,
        address user
    ) internal view returns (uint256) {
        // AppStorage storage s = diamondStorage();
        BorrowedToken[] memory borrowedTokens = s.tokensBorrowed[user];
        uint totalBorrowedInUsd = 0;

        for (uint i = 0; i < borrowedTokens.length; i++) {
            BorrowedToken memory currentBorrowedToken = borrowedTokens[i];
            uint8 decimals = IERC20(currentBorrowedToken.tokenAddress)
                .decimals();

            uint256 inUsd = _getUsdEquivalent(
                s,
                currentBorrowedToken.amountBorrowed,
                currentBorrowedToken.tokenAddress
            );

            uint256 scaledUsdAmount = (inUsd * 10 ** 18) / 10 ** decimals;

            totalBorrowedInUsd += scaledUsdAmount;
        }
        return totalBorrowedInUsd;
    }

    function _getMaxAvailableToBorrowInUsd(
        AppStorage storage s,
        address user
    ) internal view returns (int256) {
        uint256 maxLTV = _maxLTV(s, user);

        // console.log("MAX LTV: ", maxLTV);

        uint256 totalCollateralInUsd = _getUserTotalCollateralInUsd(s, user);

        // console.log("Total Collateral In Usd: ", totalCollateralInUsd);

        uint256 totalBorrowedInUsd = _getUserTotalBorrowedInUsd(s, user);

        // console.log("Total Borrowed In Usd: ", totalBorrowedInUsd);

        return
            int256(
                (maxLTV * totalCollateralInUsd) / 10000 - totalBorrowedInUsd
            );
    }

    function _maxLTV(
        AppStorage storage s,
        address user
    ) internal view returns (uint256) {
        // AppStorage storage s = diamondStorage();
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];
        uint numerator = 0;
        uint256 userTotalCollateral = _getUserTotalCollateralInUsd(s, user);

        for (uint i = 0; i < suppliedTokens.length; i++) {
            SuppliedToken memory currentSuppliedToken = suppliedTokens[i];
            Token memory tokenDetails = s.addressToToken[
                currentSuppliedToken.tokenAddress
            ];

            uint8 decimals = IERC20(currentSuppliedToken.tokenAddress)
                .decimals();

            uint256 collateralInUsd = _getUsdEquivalent(
                s,
                currentSuppliedToken.amountSupplied,
                currentSuppliedToken.tokenAddress
            );

            uint256 scaledUsdAmount = (collateralInUsd * 10 ** 18) /
                10 ** decimals;

            numerator += (scaledUsdAmount * tokenDetails.loanToValue);
        }
        return numerator / userTotalCollateral;
    }

    function _liquidationThreshold(
        AppStorage storage s,
        address user
    ) internal view returns (uint256) {
        //  AppStorage storage s = diamondStorage();
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];
        uint numerator = 0;
        uint256 userTotalCollateral = _getUserTotalCollateralInUsd(s, user);

        for (uint i = 0; i < suppliedTokens.length; i++) {
            SuppliedToken memory currentSuppliedToken = suppliedTokens[i];
            Token memory tokenDetails = s.addressToToken[
                currentSuppliedToken.tokenAddress
            ];

            uint8 decimals = IERC20(currentSuppliedToken.tokenAddress)
                .decimals();

            uint256 collateralInUsd = _getUsdEquivalent(
                s,
                currentSuppliedToken.amountSupplied,
                currentSuppliedToken.tokenAddress
            );

             uint256 scaledUsdAmount = (collateralInUsd * 10 ** 18) /
                10 ** decimals;
                

            numerator += (scaledUsdAmount * tokenDetails.liquidationThreshold);
        }
        return numerator / userTotalCollateral;
    }

    function _healthFactor(
        AppStorage storage s,
        address user
    ) internal view returns (int256) {
        uint256 userTotalCollateral = _getUserTotalCollateralInUsd(s, user);
        uint256 userLiquidationThreshold = _liquidationThreshold(s, user);
        uint256 userTotalBorrowed = _getUserTotalBorrowedInUsd(s, user);
        return
            userTotalBorrowed == 0
                ? -1
                : int256(
                    (userTotalCollateral * userLiquidationThreshold) /
                        userTotalBorrowed
                );
    }

    function _getUsdEquivalent(
        AppStorage storage s,
        uint256 amount,
        address tokenAddress
    ) internal view returns (uint256) {
        (
            uint256 dollarPerToken,
            uint256 decimals
        ) = _oneTokenEqualsHowManyDollars(s, tokenAddress);

        uint256 totalAmountInDollars = (amount * dollarPerToken) /
            (10 ** decimals);
        return totalAmountInDollars;
    }

    function _oneTokenEqualsHowManyDollars(
        AppStorage storage s,
        address tokenAddress
    ) internal view returns (uint256, uint256) {
        // AppStorage storage s = diamondStorage();

        address tokenPriceFeed = s.tokenToPriceFeed[tokenAddress];

        AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenPriceFeed);

        (, int256 answer, , , ) = priceFeed.latestRoundData();

        uint256 decimals = priceFeed.decimals();

        return (uint256(answer), decimals);
    }
}

contract Modifiers {
    AppStorage internal s;
}
