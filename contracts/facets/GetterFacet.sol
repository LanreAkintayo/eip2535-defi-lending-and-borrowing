// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, SuppliedToken, LibAppStorage, Token, Modifiers} from "../libraries/LibAppStorage.sol";

contract GetterFacet is ReentrancyGuard, Modifiers {
   

    function getData2(address user) public view returns (address) {
        console.log("User is inside supplyFacet: ",user);
        console.log("Inside SupplyFAcet: ", s.larTokenAddress);
        return s.larTokenAddress;
    }

  
}
