// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, BorrowedToken, SuppliedToken} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract GetterFacet {
    AppStorage internal s;

    function getHealthFactor(address user) public view returns (uint256) {
        return LibAppStorage._healthFactor(user);
    }

    function getMaxLTV(address user) public view returns (uint256) {
        return LibAppStorage._maxLTV(user);
    }

    function getLiquidationThreshold(
        address user
    ) public view returns (uint256) {
        return LibAppStorage._liquidationThreshold(user);
    }

     function getUserTotalCollateralInUsd(
        address user
    ) public view returns (uint256) {
        return LibAppStorage._getUserTotalCollateralInUsd(user);
    }

    function getUserTotalBorrowed(address user) public view returns (uint256) {
        return LibAppStorage._getUserTotalBorrowedInUsd(user);
    }


    function getNetworth(address user) public view returns (uint256) {
        return LibAppStorage._getUserTotalCollateralInUsd(user) - LibAppStorage._getUserTotalBorrowedInUsd(user);
    }

    function getCurrentLTV(address user) public view returns (uint256) {
        return (LibAppStorage._getUserTotalBorrowedInUsd(user) * 10000) / (LibAppStorage._getUserTotalCollateralInUsd(user));
    }

   
    function getAllSupplies(address user) public view returns (SuppliedToken[] memory) {
        return s.tokensSupplied[user];
    }

    function getAllBorrows(address user) public view returns (BorrowedToken[] memory) {
        return s.tokensBorrowed[user];
    }

    function getBorrowPower(address user) public view returns (uint256) {
        return (LibAppStorage._getUserTotalBorrowedInUsd(user) * 10000)  / (LibAppStorage._maxLTV(user) * LibAppStorage._getUserTotalCollateralInUsd(user));
    }
}
