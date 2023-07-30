// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, BorrowedToken, SuppliedToken, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract GetterFacet3 is Modifiers {

     function getData2(address user) public view returns (address) {
        console.log("User is: ",user);
        console.log("Inside getter: ", s.larTokenAddress);
        return s.larTokenAddress;
    }

    function getHealthFactor(address user) public view returns (uint256) {
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

    function getUserTotalBorrowed(address user) public view returns (uint256) {
        return LibAppStorage._getUserTotalBorrowedInUsd(s, user);
    }


    function getNetworth(address user) public view returns (uint256) {
        return LibAppStorage._getUserTotalCollateralInUsd(s, user) - LibAppStorage._getUserTotalBorrowedInUsd(s, user);
    }

    function getCurrentLTV(address user) public view returns (uint256) {
        return (LibAppStorage._getUserTotalBorrowedInUsd(s, user) * 10000) / (LibAppStorage._getUserTotalCollateralInUsd(s, user));
    }

   
    function getAllSupplies(address user) public view returns (SuppliedToken[] memory) {
        console.log("Length of all supplies: ", s.tokensSupplied[user].length);
        console.log("Token address: ", s.larTokenAddress);

        return s.tokensSupplied[user];
    }

    function getAllBorrows(address user) public view returns (BorrowedToken[] memory) {
        return s.tokensBorrowed[user];
    }

    function getBorrowPower(address user) public view returns (uint256) {
        return (LibAppStorage._getUserTotalBorrowedInUsd(s, user) * 10000)  / (LibAppStorage._maxLTV(s, user) * LibAppStorage._getUserTotalCollateralInUsd(s, user));
    }

     function getAllSupportedTokens() external view returns(address[] memory){
        return s.supportedTokens;
    }
}
