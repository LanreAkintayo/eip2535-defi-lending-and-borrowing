// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, BorrowedToken, SuppliedToken, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

abstract contract TriggerGetter {
    bool private _TRIGGER;

    constructor() {
        _TRIGGER = true;
    }
}

contract GetterFacet is TriggerGetter, Modifiers {
    function addToState(address newTokenAddress) external {
        s.larTokenAddress = newTokenAddress;
    }

    function getHealthFactor(address user) public view returns (int256) {
        return LibAppStorage._healthFactor(s, user);
    }

    function getMaxLTV(address user) public view returns (uint256) {
        return LibAppStorage._maxLTV(s, user);
    }

    function getLiquidationThreshold(
        address user
    ) public view returns (uint256) {
        return LibAppStorage._liquidationThreshold(s, user);
    }

    function getUserTotalCollateralInUsd(
        address user
    ) public view returns (uint256) {
        return LibAppStorage._getUserTotalCollateralInUsd(s, user);
    }

    function getUserTotalBorrowedInUsd(
        address user
    ) public view returns (uint256) {
        return LibAppStorage._getUserTotalBorrowedInUsd(s, user);
    }

    function getMaxAvailableToBorrowInUsd(
        address user
    ) public view returns (int256) {
        return LibAppStorage._getMaxAvailableToBorrowInUsd(s, user);
    }

    function getNetworth(address user) public view returns (uint256) {
        return
            LibAppStorage._getUserTotalCollateralInUsd(s, user) -
            LibAppStorage._getUserTotalBorrowedInUsd(s, user);
    }

    function getCurrentLTV(address user) public view returns (uint256) {
        uint256 userTotalBorrowedInUsd = LibAppStorage
            ._getUserTotalBorrowedInUsd(s, user) * 10000;
        uint256 userTotalCollateralInUsd = LibAppStorage
            ._getUserTotalCollateralInUsd(s, user);

        return
            userTotalCollateralInUsd > 0
                ? (userTotalBorrowedInUsd / userTotalCollateralInUsd)
                : 0;
    }

    function getAllSupplies(
        address user
    ) public view returns (SuppliedToken[] memory) {
        return s.tokensSupplied[user];
    }

    function getAllBorrows(
        address user
    ) public view returns (BorrowedToken[] memory) {
        return s.tokensBorrowed[user];
    }

    function getBorrowPower(address user) public view returns (uint256) {
        uint maxLTV = LibAppStorage._maxLTV(s, user);
        uint256 userTotalCollateralInUsd = LibAppStorage
            ._getUserTotalCollateralInUsd(s, user);
        return
            maxLTV > 0 && userTotalCollateralInUsd > 0
                ? (LibAppStorage._getUserTotalBorrowedInUsd(s, user) * 10000 * 10000) /
                    (maxLTV * userTotalCollateralInUsd)
                : 0;
    }

    function getAllSupportedTokens() external view returns (address[] memory) {
        return s.supportedTokens;
    }

    function getAllSuppliers() public view returns (address[] memory) {
        return s.allSuppliers;
    }

    function getAllBorrowers() public view returns (address[] memory) {
        return s.allBorrowers;
    }

    function convertUsdToToken(
        address tokenAddress,
        uint256 usdAmount
    ) public view returns (uint256) {
        (uint256 oneTokenPrice, uint256 decimals) = LibAppStorage
            ._oneTokenEqualsHowManyDollars(s, tokenAddress);
        return (usdAmount * 10 ** decimals) / oneTokenPrice;
    }

    function getUsdEquivalence(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        return LibAppStorage._getUsdEquivalent(s, tokenAmount, tokenAddress);
    }

    function getTokenDetails(
        address tokenAddress
    ) public view returns (Token memory) {
        return s.addressToToken[tokenAddress];
    }

    function getTokenTotalSupplied(
        address tokenAddress
    ) public view returns (uint256) {
        return s.totalSupplied[tokenAddress];
    }

    function getTokenTotalBorrowed(
        address tokenAddress
    ) public view returns (uint256) {
        return s.totalBorrowed[tokenAddress];
    }
}
